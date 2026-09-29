# Diploma PPTX -> PDF

Este proyecto reemplaza datos de un participante en `plantilla_diploma.pptx`, crea un PPTX temporal y lo convierte a `diploma_Juan_Perez.pdf`.

## ¿Hace falta instalar LibreOffice?

**No, no para el flujo predeterminado.** El motor principal es `pptx-glimpse`, que interpreta el PPTX y genera SVG en memoria. Después, `svg-to-pdfkit` convierte ese SVG en un PDF, sin ejecutar LibreOffice ni otro proceso externo.

El renderizador incluye una comprobación de cobertura: si algún elemento del diseño no se puede renderizar, el script falla en lugar de entregar un PDF incompleto.

Algunas plantillas no incluyen las fuentes originales o las incluyen en un formato que el renderer no reutiliza. Para conservar también la tipografía original, hay que instalar las fuentes en el servidor o indicar sus directorios con `PPT_FONT_DIRS`.

## Requisitos

- Node.js 22 o superior.
- No se requiere LibreOffice para el motor predeterminado.

## Instalación

```bash
npm install
```

Instalación explícita de las dependencias:

```bash
npm install pizzip @xmldom/xmldom pptx-glimpse svg-to-pdfkit pdfkit @betteroffice/fonts
```

`libreoffice-convert` es opcional y solo se necesita si se quiere usar el motor `libreoffice`:

```bash
npm install --save-optional libreoffice-convert
```

Para una instalación que no incluya ni siquiera el paquete opcional de LibreOffice:

```bash
npm install --omit=optional
```

## Fuentes

Las plantillas pueden declarar fuentes como `Arial`, `Times New Roman`, `TeXGyreChorus` o `Corsiva`, pero no necesariamente las incluyen en el PPTX. El proyecto incluye una alternativa libre de `TeX Gyre Chorus` en `fonts/` y usa las fuentes metricamente compatibles de `@betteroffice/fonts` para Arial y Times New Roman.

En Linux también se pueden instalar las fuentes del sistema:

```bash
sudo apt update
sudo apt install fonts-liberation fonts-texgyre fonts-urw-base35
```

Si las fuentes originales están en otra ubicación:

```bash
PPT_FONT_DIRS=/ruta/a/fuentes node app.js
```

En Windows se usa `;` como separador:

```powershell
$env:PPT_FONT_DIRS = "C:\Fonts;D:\MoreFonts"
node app.js
```

Para indicar explícitamente el nombre de una fuente original se puede usar un JSON en `PPT_FONT_MAPPING`:

```bash
PPT_FONT_MAPPING='{"Corsiva":"Corsiva","TeXGyreChorus":"TeX Gyre Chorus"}' node app.js
```

Si no se encuentra una fuente, el script muestra una advertencia pero no elimina elementos del diseño.

## Ejecución

```bash
node app.js
```

o:

```bash
npm start
```

El resultado esperado es:

```text
diploma_Juan_Perez.pdf
```

El directorio temporal del PPTX se crea con `fs.mkdtemp()` y se elimina en un bloque `finally`, incluso si la conversión falla.

## Diagnóstico del problema anterior

El motor puro `pptx-to-pdf` que se probó inicialmente agrupaba las imágenes después de las formas al construir el PDF. En esta plantilla, la imagen de fondo de página completa terminaba dibujándose encima de los textos y ocultaba el diseño. Además, generaba un operador PDF inválido (`undefined J`) y no era apto para un diploma con tipografía y elementos heredados de PowerPoint.

Por eso se cambió el motor predeterminado a `pptx-glimpse`, que conserva el orden del árbol de formas, renderiza los elementos a SVG y valida que no se omita ningún elemento antes de crear el PDF.

## Motores de conversión

### JavaScript, sin LibreOffice (predeterminado)

```bash
PDF_ENGINE=pptx-glimpse node app.js
```

El PDF contiene las formas, imágenes y glifos como paths. Esto conserva el diseño y evita que al visor le falte una fuente, pero el texto del PDF no es seleccionable.

### LibreOffice opcional

Para obtener texto seleccionable y mayor compatibilidad con formatos complejos:

```bash
PDF_ENGINE=libreoffice node app.js
```

En este modo debe existir `libreoffice` o `soffice` en el `PATH`. Si está en otra ubicación:

```bash
PDF_ENGINE=libreoffice LIBREOFFICE_PATH=/ruta/a/soffice node app.js
```

En Windows:

```powershell
$env:PDF_ENGINE = "libreoffice"
$env:LIBREOFFICE_PATH = "C:\Program Files\LibreOffice\program\soffice.exe"
node app.js
```

## Placeholders de la plantilla

La plantilla actual utiliza corchetes:

- `[Nombre y Apellido]`
- `[Grado]`

El código también acepta la convención anterior con llaves, por ejemplo `{nombre_completo}`, `{grado}` o `{fecha}`. El objeto de ejemplo de `app.js` incluye `nombre`, `grado`, `dni` y `fecha`; `nombre_completo` se deriva automáticamente de `nombre`.

PowerPoint puede partir una etiqueta en varios elementos XML, por ejemplo `[Nombre y ` y `Apellido]`. El código concatena temporalmente el texto de cada párrafo, encuentra la etiqueta y vuelve a distribuir el valor sin romper el diseño.

## Por qué no se usa `docxtemplater`

`docxtemplater` es una librería para plantillas DOCX. Para un PPTX, que es un paquete OOXML basado en ZIP, el ejemplo usa:

- `pizzip` para leer y escribir el paquete PPTX.
- `@xmldom/xmldom` para modificar únicamente el texto de los nodos XML.
- `pptx-glimpse` para renderizar el diseño a SVG.
- `svg-to-pdfkit` y `pdfkit` para crear el PDF.
- `libreoffice-convert` únicamente como motor opcional de alta fidelidad.

## Estructura del flujo

1. `generarDiploma()` lee `plantilla_diploma.pptx`.
2. `replacePlaceholdersInPptx()` procesa los XML de diapositivas y notas.
3. Se escribe `diploma.pptx` en un directorio temporal único.
4. `convertPptxToPdf()` convierte el temporal a PDF con el motor seleccionado.
5. Se guarda el PDF con el nombre del participante.
6. El directorio temporal se elimina siempre.

En una aplicación real, `participante` puede ser el resultado validado de un `req.body`, y el PDF puede enviarse como respuesta HTTP o almacenarse en un bucket. No se debe usar directamente una ruta enviada por el usuario para leer o escribir archivos.
