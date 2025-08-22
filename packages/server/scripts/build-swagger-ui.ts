import { getAbsoluteFSPath } from 'swagger-ui-dist';
import fs from 'fs-extra';
import path from 'path';

const swaggerUiPath = getAbsoluteFSPath();
const outputDir = path.resolve(__dirname, '../../../docs/swagger');
const swaggerJsonPath = path.resolve(__dirname, '../../swagger.json');

// 📁 1. Swagger UI 정적 리소스 복사 (swagger-initializer.js 제외)
fs.ensureDirSync(outputDir);
fs.readdirSync(swaggerUiPath).forEach((file) => {
  if (file !== 'swagger-initializer.js') {
    fs.copySync(path.join(swaggerUiPath, file), path.join(outputDir, file));
  }
});

// 📄 2. Swagger JSON 복사
fs.copySync(swaggerJsonPath, path.join(outputDir, 'swagger.json'));

// 📝 3. index.html 내 기본 Swagger URL 수정
const indexHtmlPath = path.join(outputDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf-8');
html = html.replace('https://petstore.swagger.io/v2/swagger.json', './swagger.json');
fs.writeFileSync(indexHtmlPath, html);

// 🧠 4. swagger-initializer.js 직접 생성
const initializerContent = `
window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "./swagger.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "StandaloneLayout"
  });
};
`;
fs.writeFileSync(
  path.join(outputDir, 'swagger-initializer.js'),
  initializerContent.trim()
);

console.log(`✅ Swagger UI generated at ${outputDir}`);
