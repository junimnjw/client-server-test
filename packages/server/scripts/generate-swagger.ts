// packages/server/scripts/generate-swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { swaggerOptions } from '../src/config/swagger-config';

const spec = swaggerJsdoc(swaggerOptions);
const outPath = path.resolve(__dirname, '../../swagger.json');

fs.writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log(`✅ Swagger spec saved to ${outPath}`);
