import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

type LegacyGenerator = {
  generarDiploma(input: { datos: { nombre: string; grado: string }; outputDir: string }): Promise<{ pdfPath: string }>;
};

export type DiplomaGenerator = {
  generate(input: { fullName: string; militaryRank: string }): Promise<Buffer>;
};

/** ESM boundary around the legacy CommonJS diploma renderer. */
export function createDiplomaGenerator(modulePath = path.resolve(process.cwd(), 'diploma/app.js')): DiplomaGenerator {
  const legacy = createRequire(import.meta.url)(modulePath) as LegacyGenerator;
  return {
    async generate({ fullName, militaryRank }) {
      const outputDir = await mkdtemp(path.join(os.tmpdir(), 'diploma-output-'));
      try {
        const result = await legacy.generarDiploma({ datos: { nombre: fullName, grado: militaryRank }, outputDir });
        return await readFile(result.pdfPath);
      } finally {
        await rm(outputDir, { recursive: true, force: true });
      }
    }
  };
}
