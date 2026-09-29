'use strict';

/**
 * Generación de diplomas a partir de una plantilla PPTX.
 *
 * Un archivo .pptx es un archivo ZIP que contiene XML. Por eso el flujo es:
 *  1. leer la plantilla;
 *  2. reemplazar los placeholders en los XML de las diapositivas;
 *  3. crear un PPTX temporal;
 *  4. convertir ese PPTX a PDF con un motor JavaScript (o LibreOffice
 *     opcionalmente);
 *  5. guardar el PDF final y borrar el temporal.
 *
 * docxtemplater está pensado para documentos DOCX, no para PPTX. Para este
 * caso se usa PizZip + un parser XML, que permite conservar el diseño, las
 * imágenes y las relaciones internas del archivo original.
 */

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const PizZip = require('pizzip');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

// pptx-glimpse usa Web Crypto para algunos recursos de OOXML. Node 18 no lo
// expone globalmente en CommonJS, así que lo habilitamos también allí.
if (!globalThis.crypto) {
  globalThis.crypto = require('node:crypto').webcrypto;
}

const { convertPptxToSvg } = require('pptx-glimpse');

// LibreOffice es una dependencia opcional: solo se carga si se selecciona
// PDF_ENGINE=libreoffice. Así el flujo JavaScript funciona aunque el paquete
// no se instale en un servidor que no utiliza ese motor.
let convertWithOptionsPromise;

function getLibreOfficeConverter() {
  if (!convertWithOptionsPromise) {
    let libreoffice;
    try {
      libreoffice = require('libreoffice-convert');
    } catch {
      throw new Error(
        'El motor LibreOffice no está instalado. Ejecuta ' +
        '`npm install libreoffice-convert` o usa PDF_ENGINE=pptx-glimpse.',
      );
    }

    // convertWithOptions recibe un Buffer, el formato y un callback. Lo
    // envuelvo en una Promise para poder esperar el PDF con async/await.
    convertWithOptionsPromise = promisify(libreoffice.convertWithOptions);
  }

  return convertWithOptionsPromise;
}

const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main';
// Acepta las dos convenciones usadas por las plantillas:
//   {nombre_completo} y [Nombre y Apellido]
const XML_PLACEHOLDER_PATTERN = /\{([^{}\[\]]+)\}|\[([^\[\]]+)\]/g;

const PLACEHOLDER_ALIASES = {
  nombre: ['nombre', 'nombre_completo'],
  nombre_completo: ['nombre_completo', 'nombre'],
  nombre_y_apellido: ['nombre_completo', 'nombre'],
  nombre_apellido: ['nombre_completo', 'nombre'],
  grado: ['grado'],
  dni: ['dni'],
  fecha: ['fecha'],
};
const TEXT_PART_PATTERN = /^ppt\/(?:slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/;
const TEMPLATE_PATH = path.join(__dirname, 'plantilla_diploma.pptx');
const DEFAULT_PDF_ENGINE = 'pptx-glimpse';
const EMU_PER_POINT = 914400 / 72;

// Algunas plantillas no incluyen las fuentes originales o las incluyen en un
// formato que el renderer no reutiliza. Estas sustituciones permiten usar
// alternativas open source; si no, pptx-glimpse devuelve una advertencia pero
// no elimina elementos del diseño.
const DEFAULT_FONT_MAPPING = {
  Arial: 'Liberation Sans',
  'Times New Roman': 'Liberation Serif',
  'Times New Roman MT': 'Liberation Serif',
  'Times New Roman MT Italics': 'Liberation Serif',
  'Times New Roman MT Bold': 'Liberation Serif',
  'ＭＳ Ｐゴシック': 'Liberation Serif',
  TeXGyreChorus: 'TeX Gyre Chorus',
  Corsiva: 'TeX Gyre Chorus',
};

/**
 * Datos simulados que normalmente llegarían desde un formulario HTTP.
 *
 * La plantilla actual utiliza [Nombre y Apellido] y [Grado]. El código
 * también acepta la convención anterior {nombre_completo}, {grado}, etc.
 * Se incluyen `nombre`, `grado`, `dni` y `fecha` para mostrar el formato que
 * podría usar una aplicación real. `nombre_completo` se deriva de `nombre`.
 */
const participante = {
  nombre: 'Juan Pérez',
  grado: 'Teniente',
  dni: '30123456',
  fecha: '25 de septiembre de 2026',
};

/**
 * Valida y convierte los valores a texto. DOM se encargará de escapar los
 * caracteres XML especiales (<, >, &, etc.) al insertarlos en un nodo <a:t>.
 */
function normalizarDatos(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new TypeError('Los datos del participante deben ser un objeto.');
  }

  const datosNormalizados = Object.create(null);

  for (const [clave, valor] of Object.entries(datos)) {
    if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(clave)) {
      throw new Error(`La clave "${clave}" no es un nombre de placeholder válido.`);
    }

    if (valor === null || valor === undefined) {
      throw new Error(`El valor de "${clave}" no puede ser null o undefined.`);
    }

    datosNormalizados[clave] = String(valor);
  }

  // Permite que el formulario de una aplicación use únicamente `nombre`.
  if (
    !Object.prototype.hasOwnProperty.call(datosNormalizados, 'nombre_completo') &&
    Object.prototype.hasOwnProperty.call(datosNormalizados, 'nombre')
  ) {
    datosNormalizados.nombre_completo = datosNormalizados.nombre;
  }

  return datosNormalizados;
}

/**
 * Parsea un XML de OOXML y convierte los errores de parsing en excepciones
 * con un mensaje útil.
 */
function parseXml(xml, nombreParte) {
  const parser = new DOMParser({
    locator: false,
    onError: (nivel, mensaje) => {
      if (nivel === 'error' || nivel === 'fatalError') {
        throw new Error(mensaje);
      }
    },
  });

  try {
    return parser.parseFromString(xml, 'application/xml');
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo interpretar el XML de ${nombreParte}: ${detalle}`);
  }
}

/**
 * Añade a `salida` el texto originals que queda entre dos posiciones
 * globales. La posición se reparte entre los distintos nodos <a:t>, por lo
 * que se conserva el formato de los runs que quedan fuera de un placeholder.
 */
function appendTextRange(salida, textosOriginales, inicio, fin) {
  let posicionGlobal = 0;

  for (let indice = 0; indice < textosOriginales.length; indice += 1) {
    const inicioNodo = posicionGlobal;
    const finNodo = inicioNodo + textosOriginales[indice].length;
    const inicioTrozo = Math.max(inicio, inicioNodo);
    const finTrozo = Math.min(fin, finNodo);

    if (inicioTrozo < finTrozo) {
      salida[indice] += textosOriginales[indice].slice(
        inicioTrozo - inicioNodo,
        finTrozo - inicioNodo,
      );
    }

    posicionGlobal = finNodo;
  }
}

/**
 * Devuelve el nodo <a:t> que contiene una posición global. Si la posición
 * está justo entre dos runs, se elige el run siguiente.
 */
function findTextNodeIndex(textos, posicion) {
  let posicionGlobal = 0;

  for (let indice = 0; indice < textos.length; indice += 1) {
    const finNodo = posicionGlobal + textos[indice].length;
    if (posicion >= posicionGlobal && posicion < finNodo) {
      return indice;
    }
    posicionGlobal = finNodo;
  }

  return Math.max(0, textos.length - 1);
}

/**
 * Normaliza el texto de una etiqueta para poder asociarlo con una clave del
 * objeto de datos. Por ejemplo, "Nombre y Apellido" -> "nombre_y_apellido".
 */
function normalizePlaceholderLabel(label) {
  return String(label)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function isLikelyOoxmlId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value).trim(),
  );
}

/**
 * Resuelve etiquetas genéricas como [Nombre y Apellido] contra las claves
 * del objeto. Devuelve null cuando no existe un dato para esa etiqueta.
 */
function resolvePlaceholderKey(label, datos) {
  const etiqueta = String(label).trim();
  const normalizada = normalizePlaceholderLabel(etiqueta);
  const alias = PLACEHOLDER_ALIASES[normalizada] || [];
  const candidatas = [etiqueta, normalizada, ...alias].filter(Boolean);

  return candidatas.find((clave) =>
    Object.prototype.hasOwnProperty.call(datos, clave),
  ) || null;
}

/**
 * Reemplaza placeholders dentro de un párrafo.
 *
 * PowerPoint puede dividir una etiqueta en varios runs, por ejemplo:
 *   <a:t>[Nombre y </a:t><a:t>Apellido]</a:t>
 * Esta función concatena temporalmente esos textos, encuentra las etiquetas y
 * vuelve a distribuir el resultado sin tocar el resto del diseño.
 */
function replacePlaceholdersInParagraph(paragraph, datos, estadisticas) {
  const textNodes = Array.from(
    paragraph.getElementsByTagNameNS(A_NS, 't'),
  );
  const textosOriginales = textNodes.map((node) => node.textContent || '');
  const textoCompleto = textosOriginales.join('');

  if (!textoCompleto) {
    return;
  }

  const coincidencias = [];
  const patron = new RegExp(XML_PLACEHOLDER_PATTERN.source, 'g');
  let coincidencia;

  while ((coincidencia = patron.exec(textoCompleto)) !== null) {
    const etiqueta = coincidencia[1] ?? coincidencia[2];
    const clave = resolvePlaceholderKey(etiqueta, datos);

    if (!clave) {
      if (!isLikelyOoxmlId(etiqueta)) {
        estadisticas.unresolvedKeys.add(String(etiqueta).trim());
      }
      continue;
    }

    coincidencias.push({
      clave,
      inicio: coincidencia.index,
      fin: coincidencia.index + coincidencia[0].length,
      valor: datos[clave],
    });
  }

  if (coincidencias.length === 0) {
    return;
  }

  const salida = textosOriginales.map(() => '');
  let cursor = 0;

  for (const coincidencia of coincidencias) {
    appendTextRange(salida, textosOriginales, cursor, coincidencia.inicio);

    // El valor hereda el formato del run donde comienza la etiqueta.
    const indiceInicio = findTextNodeIndex(textosOriginales, coincidencia.inicio);
    salida[indiceInicio] += coincidencia.valor;

    cursor = coincidencia.fin;
    estadisticas.replacementCount += 1;
    estadisticas.usedKeys.add(coincidencia.clave);
  }

  appendTextRange(salida, textosOriginales, cursor, textoCompleto.length);

  textNodes.forEach((node, indice) => {
    // Asignar textContent hace que el serializer escape correctamente el
    // valor (por ejemplo, un DNI con & o un nombre con acentos).
    node.textContent = salida[indice];
  });
}

/**
 * Reemplaza placeholders en un XML de una diapositiva o de sus notas.
 */
function replacePlaceholdersInXml(xml, datos, nombreParte = 'XML') {
  const datosNormalizados = normalizarDatos(datos);
  const documento = parseXml(xml, nombreParte);
  const parrafos = Array.from(documento.getElementsByTagNameNS(A_NS, 'p'));
  const estadisticas = {
    replacementCount: 0,
    usedKeys: new Set(),
    unresolvedKeys: new Set(),
  };

  for (const parrafo of parrafos) {
    replacePlaceholdersInParagraph(
      parrafo,
      datosNormalizados,
      estadisticas,
    );
  }

  return {
    xml: new XMLSerializer().serializeToString(documento),
    ...estadisticas,
  };
}

/**
 * Procesa todos los XML de texto de un PPTX y devuelve otro PPTX en un Buffer.
 * No se modifica la plantilla original.
 */
function replacePlaceholdersInPptx(pptxBuffer, datos) {
  const datosNormalizados = normalizarDatos(datos);
  const zip = new PizZip(pptxBuffer);
  const partes = Object.keys(zip.files).filter((nombre) => TEXT_PART_PATTERN.test(nombre));

  if (partes.length === 0) {
    throw new Error('El archivo no contiene partes XML de diapositivas válidas.');
  }

  const estadisticas = {
    replacementCount: 0,
    usedKeys: new Set(),
    unresolvedKeys: new Set(),
  };

  for (const nombreParte of partes) {
    const entrada = zip.file(nombreParte);
    if (!entrada) {
      continue;
    }

    const resultado = replacePlaceholdersInXml(
      entrada.asText(),
      datosNormalizados,
      nombreParte,
    );

    if (resultado.replacementCount > 0) {
      zip.file(nombreParte, resultado.xml);
    }

    for (const clave of resultado.usedKeys) {
      estadisticas.usedKeys.add(clave);
    }
    for (const clave of resultado.unresolvedKeys) {
      estadisticas.unresolvedKeys.add(clave);
    }
    estadisticas.replacementCount += resultado.replacementCount;
  }

  if (estadisticas.unresolvedKeys.size > 0) {
    const faltantes = [...estadisticas.unresolvedKeys].join(', ');
    throw new Error(
      `La plantilla contiene placeholders sin datos: ${faltantes}. ` +
      'Agrega esos campos al objeto del participante.',
    );
  }

  if (estadisticas.replacementCount === 0) {
    throw new Error(
      'No se encontró ningún placeholder reemplazable. ' +
      'Revisa que las etiquetas estén escritas como {nombre}, {dni}, etc.',
    );
  }

  return {
    buffer: zip.generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    }),
    replacementCount: estadisticas.replacementCount,
    usedKeys: estadisticas.usedKeys,
  };
}

/**
 * Devuelve los directorios de fuentes que se deben escanear. El paquete
 * también busca las fuentes del sistema; estas rutas permiten agregar fuentes
 * corporativas o empaquetadas de forma explícita.
 */
function getConfiguredFontDirs() {
  const directories = [];

  // @betteroffice/fonts incluye alternativas metricamente compatibles para
  // Arial y Times New Roman. Se añade automáticamente si está disponible.
  try {
    const fontsPackage = require.resolve('@betteroffice/fonts/package.json');
    directories.push(path.join(path.dirname(fontsPackage), 'assets'));
  } catch {
    // El paquete es opcional; el renderer usará las fuentes del sistema.
  }

  if (process.env.PPT_FONT_DIRS) {
    directories.push(
      ...process.env.PPT_FONT_DIRS
        .split(path.delimiter)
        .map((directory) => directory.trim())
        .filter(Boolean),
    );
  }

  // Si el proyecto incluye una carpeta fonts/, se utiliza automáticamente.
  directories.push(path.join(__dirname, 'fonts'));
  return directories;
}

/**
 * Permite sustituir el mapeo de fuentes mediante una variable de entorno,
 * por ejemplo cuando el servidor tiene las fuentes originales instaladas.
 */
function getFontMapping({ useBundledFonts = false } = {}) {
  const mapping = useBundledFonts
    ? {
      Arial: 'Arial',
      'Times New Roman': 'Times New Roman',
      'Times New Roman MT': 'Times New Roman',
      'Times New Roman MT Italics': 'Times New Roman',
      'Times New Roman MT Bold': 'Times New Roman',
      'ＭＳ Ｐゴシック': 'Times New Roman',
      TeXGyreChorus: 'TeXGyreChorus',
      Corsiva: 'Corsiva',
    }
    : { ...DEFAULT_FONT_MAPPING };

  if (process.env.PPT_FONT_MAPPING) {
    try {
      Object.assign(mapping, JSON.parse(process.env.PPT_FONT_MAPPING));
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      console.warn(`PPT_FONT_MAPPING no es un JSON válido: ${detalle}`);
    }
  }

  return mapping;
}

/**
 * Carga fuentes de fallback de forma explícita. Registrarlas con los nombres
 * que usa la plantilla evita que el motor sustituya Arial/Times por otra
 * métrica y termine repartiendo el texto en una página diferente.
 */
async function getBundledFontBuffers() {
  const buffers = [];
  const addFont = async (name, filePath) => {
    try {
      buffers.push({ name, data: await fs.readFile(filePath) });
    } catch {
      // Una fuente opcional que no esté instalada no debe impedir el render.
    }
  };

  let liberationAssets;
  try {
    const fontsPackage = require.resolve('@betteroffice/fonts/package.json');
    liberationAssets = path.join(path.dirname(fontsPackage), 'assets');
  } catch {
    liberationAssets = undefined;
  }

  if (liberationAssets) {
    const liberationFonts = [
      ['Arial', 'LiberationSans-Regular.ttf'],
      ['Arial', 'LiberationSans-Bold.ttf'],
      ['Arial', 'LiberationSans-Italic.ttf'],
      ['Arial', 'LiberationSans-BoldItalic.ttf'],
      ['Times New Roman', 'LiberationSerif-Regular.ttf'],
      ['Times New Roman', 'LiberationSerif-Bold.ttf'],
      ['Times New Roman', 'LiberationSerif-Italic.ttf'],
      ['Times New Roman', 'LiberationSerif-BoldItalic.ttf'],
    ];

    for (const [name, fileName] of liberationFonts) {
      await addFont(name, path.join(liberationAssets, fileName));
    }
  }

  const chorusFont = path.join(
    __dirname,
    'fonts',
    'TeXGyreChorus-MediumItalic.otf',
  );
  await addFont('TeXGyreChorus', chorusFont);
  await addFont('Corsiva', chorusFont);

  return buffers;
}

/**
 * Obtiene el tamaño original de la diapositiva desde presentation.xml y lo
 * convierte de EMU a puntos PDF. Así el PDF no cambia la proporción de la
 * plantilla.
 */
function getSlidePageSize(pptxBuffer, svg) {
  try {
    const zip = new PizZip(pptxBuffer);
    const presentationPart = zip.file('ppt/presentation.xml');

    if (presentationPart) {
      const document = parseXml(
        presentationPart.asText(),
        'ppt/presentation.xml',
      );
      const sizeElement = document.getElementsByTagNameNS(P_NS, 'sldSz')[0];
      const widthEmu = Number(sizeElement?.getAttribute('cx'));
      const heightEmu = Number(sizeElement?.getAttribute('cy'));

      if (widthEmu > 0 && heightEmu > 0) {
        return {
          width: widthEmu / EMU_PER_POINT,
          height: heightEmu / EMU_PER_POINT,
        };
      }
    }
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    console.warn(`No se pudo leer el tamaño de la diapositiva: ${detalle}`);
  }

  // Fallback para PPTX que no tengan p:sldSz: usa el viewBox del SVG.
  const viewBox = svg?.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i);
  if (viewBox) {
    return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
  }

  return { width: 780, height: 540 };
}

/**
 * Crea un PDF con una página por diapositiva. El SVG de pptx-glimpse contiene
 * las formas y los glifos como paths, por lo que el diseño no depende de que
 * el visor del PDF tenga instaladas las fuentes originales.
 */
function renderSvgSlidesAsPdf(slides, pageSize) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const { width, height } = pageSize;
    const document = new PDFDocument({
      autoFirstPage: false,
      compress: true,
      margin: 0,
      size: [width, height],
    });

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    try {
      for (const slide of slides) {
        document.addPage({ size: [width, height], margin: 0 });
        SVGtoPDF(document, slide.svg, 0, 0, {
          width,
          height,
          preserveAspectRatio: 'none',
          warningCallback: (warning) => {
            console.warn(`Advertencia de svg-to-pdfkit: ${warning}`);
          },
        });
      }

      document.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Renderiza el PPTX con pptx-glimpse y lo convierte a PDF sin usar LibreOffice
 * ni un proceso externo. Se rechazan las conversiones que hayan omitido
 * elementos para no entregar un PDF incompliso silenciosamente.
 */
async function convertPptxWithGlimpse(pptxBuffer) {
  // Si el usuario no indica otra carpeta, se cargan las alternativas que
  // acompañan al proyecto para que el resultado sea reproducible.
  const useBundledFonts =
    !process.env.PPT_FONT_DIRS && !process.env.PPT_FONT_MAPPING;
  const bundledFonts = useBundledFonts ? await getBundledFontBuffers() : [];
  const options = {
    fontDirs: getConfiguredFontDirs(),
    fontMapping: getFontMapping({ useBundledFonts: bundledFonts.length > 0 }),
    // Los paths evitan perder el texto en visores sin las fuentes originales.
    textOutput: 'path',
  };

  if (bundledFonts.length > 0) {
    options.fonts = bundledFonts;
    options.skipSystemFonts = true;
  }

  const report = await convertPptxToSvg(pptxBuffer, options);

  const errors = (report.diagnostics || []).filter(
    (diagnostic) => diagnostic.severity === 'error',
  );
  if (errors.length > 0) {
    throw new Error(
      `pptx-glimpse encontró errores: ${errors
        .map((diagnostic) => diagnostic.message)
        .join('; ')}`,
    );
  }

  for (const diagnostic of report.diagnostics || []) {
    if (diagnostic.severity === 'warning') {
      console.warn(`Advertencia de pptx-glimpse: ${diagnostic.message}`);
    }
  }

  const overallCoverage = report.supportCoverage?.overall;
  const skippedElements = overallCoverage?.skippedElements ?? 0;
  const unresolvedElements = overallCoverage?.unresolvedElements ?? 0;
  if (
    overallCoverage?.inputElements !== undefined &&
    overallCoverage?.outputElements !== undefined
  ) {
    console.log(
      `Cobertura del diseño: ${overallCoverage.outputElements}/` +
      `${overallCoverage.inputElements} elementos`,
    );
  }

  const lostElements = skippedElements + unresolvedElements;
  if (lostElements > 0) {
    throw new Error(
      `El renderizador omitió o no resolvió ${lostElements} elemento(s) ` +
      'del diseño. Usa PDF_ENGINE=libreoffice para una conversión de alta fidelidad.',
    );
  }

  if (!report.slides || report.slides.length === 0) {
    throw new Error('pptx-glimpse no generó ninguna diapositiva.');
  }

  const pageSize = getSlidePageSize(pptxBuffer, report.slides[0].svg);
  return renderSvgSlidesAsPdf(report.slides, pageSize);
}

/**
 * Convierte un Buffer PPTX a un Buffer PDF.
 *
 * El motor predeterminado es `pptx-glimpse`, que renderiza el PPTX con
 * JavaScript y no necesita LibreOffice ni un proceso externo. Para
 * presentaciones con una exigencia de fidelidad mayor, se puede seleccionar
 * `PDF_ENGINE=libreoffice` y usar la segunda opción.
 */
async function convertPptxToPdf(
  pptxBuffer,
  { engine = process.env.PDF_ENGINE || DEFAULT_PDF_ENGINE } = {},
) {
  if (engine === 'pptx-glimpse') {
    return convertPptxWithGlimpse(pptxBuffer);
  }

  if (engine === 'libreoffice') {
    const options = {
      // El nombre de archivo temporal que utiliza internamente el conversor.
      fileName: 'source.pptx',
    };

    if (process.env.LIBREOFFICE_PATH) {
      options.sofficeBinaryPaths = [path.resolve(process.env.LIBREOFFICE_PATH)];
    }

    // El filtro de Impress es el que exporta presentaciones a PDF.
    const convertWithOptions = getLibreOfficeConverter();
    return convertWithOptions(
      pptxBuffer,
      'pdf',
      'impress_pdf_Export',
      options,
    );
  }

  throw new Error(
    `Motor PDF desconocido: "${engine}". Usa "pptx-glimpse" o "libreoffice".`,
  );
}

/**
 * Convierte un nombre en una parte segura de un nombre de archivo.
 * Juan Pérez -> Juan_Perez.
 */
function slugify(valor) {
  const texto = String(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return texto || 'participante';
}

/**
 * Flujo completo: plantilla -> PPTX temporal -> PDF final.
 */
async function generarDiploma({
  plantillaPath = TEMPLATE_PATH,
  datos = participante,
  outputDir = __dirname,
  pdfEngine = process.env.PDF_ENGINE || DEFAULT_PDF_ENGINE,
} = {}) {
  // 1. Leer la plantilla base sin modificarla.
  const plantillaBuffer = await fs.readFile(plantillaPath);

  // 2. Reemplazar las etiquetas y crear el contenido del PPTX temporal.
  const resultadoPlantilla = replacePlaceholdersInPptx(plantillaBuffer, datos);

  // 3. Crear un directorio temporal único para evitar colisiones entre
  // varias solicitudes simultáneas.
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diploma-'));
  const temporaryPptxPath = path.join(temporaryDir, 'diploma.pptx');
  let pdfPath;

  try {
    // 4. Guardar el PPTX ya injectado.
    await fs.writeFile(temporaryPptxPath, resultadoPlantilla.buffer);

    // 5. Leer el temporal y convertirlo a PDF.
    const temporalParaConvertir = await fs.readFile(temporaryPptxPath);
    const pdfBuffer = await convertPptxToPdf(temporalParaConvertir, {
      engine: pdfEngine,
    });

    // 6. Construir el nombre solicitado y guardar el PDF final.
    const nombreParticipante = datos.nombre || datos.nombre_completo;
    if (!nombreParticipante) {
      throw new Error('Se necesita `nombre` o `nombre_completo` para el nombre del PDF.');
    }

    await fs.mkdir(outputDir, { recursive: true });
    pdfPath = path.join(outputDir, `diploma_${slugify(nombreParticipante)}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    return {
      pdfPath,
      engine: pdfEngine,
      replacementCount: resultadoPlantilla.replacementCount,
      usedKeys: [...resultadoPlantilla.usedKeys],
    };
  } finally {
    // 7. Eliminar siempre el PPTX temporal, incluso si falla la conversión.
    try {
      await fs.rm(temporaryDir, { recursive: true, force: true });
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      console.warn(`No se pudo eliminar el temporal ${temporaryDir}: ${detalle}`);
    }
  }
}

/**
 * Permite probar este archivo como módulo sin convertirlo a PDF al importarlo.
 */
async function main() {
  console.log('Generando diploma...');
  const resultado = await generarDiploma();
  console.log(`PDF generado: ${resultado.pdfPath}`);
  console.log(`Motor de conversión: ${resultado.engine}`);
  console.log(`Placeholders reemplazados: ${resultado.replacementCount}`);
  console.log('El PPTX temporal fue eliminado.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Error al generar el diploma: ${error.message}`);
    if (
      process.env.PDF_ENGINE === 'libreoffice' &&
      (error.message.includes('soffice') || error.message.includes('LibreOffice'))
    ) {
      console.error(
        'Instala LibreOffice y verifica que `libreoffice` o `soffice` esté en el PATH.',
      );
    }
    process.exitCode = 1;
  });
}

module.exports = {
  generarDiploma,
  convertPptxToPdf,
  replacePlaceholdersInPptx,
  replacePlaceholdersInXml,
  slugify,
};
