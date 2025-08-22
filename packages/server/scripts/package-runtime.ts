//src/scripts/package-runtime.ts
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { mkdir, readdir, rm } from 'fs/promises';

// Constants for better maintainability
const ZIP_COMPRESSION_LEVEL = 9;

// Read package.json from the project root
function readPkg(root: string) {
  const pkgPath = path.join(root, 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
}

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const runtimeDir = path.join(projectRoot, 'runtime');
const outputDir = path.join(projectRoot, 'out');
const licenseFile = path.join(projectRoot, 'LICENSE.nodejs.txt');

const { name, version } = readPkg(projectRoot);

// Generate launch script for each platform
function getLaunchScript(platform: string): { fileName: string; content: string } {
  const isWin = platform.startsWith('win');
  return isWin
    ? {
        fileName: 'run.cmd',
        content: `@echo off\r\ncd /d %~dp0\r\nruntime\\node.exe dist\\index.js %*`,
      }
    : {
        fileName: 'run.sh',
        content: `#!/bin/bash\ncd "$(dirname "$0")"\n./runtime/node dist/index.js "$@"`,
      };
}

// Get a list of available platforms from the runtime directory
async function getAvailablePlatforms(): Promise<string[]> {
  const entries = await readdir(runtimeDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

// Create a zip file for the given platform
async function createZip(platform: string): Promise<void> {
  const zipName = `${name}-${version}-${platform}.zip`;
  const zipPath = path.join(outputDir, zipName);

  const archive = archiver('zip', { zlib: { level: ZIP_COMPRESSION_LEVEL } });
  const output = fs.createWriteStream(zipPath);

  // Set up error handling for the archive
  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  const { fileName: scriptName, content: scriptContent } = getLaunchScript(platform);

  try {
    // Add runtime binaries
    archive.directory(path.join(runtimeDir, platform), 'runtime');

    // Add compiled server
    archive.file(path.join(distDir, 'index.js'), { name: 'dist/index.js' });

    // Add license file if it exists
    if (fs.existsSync(licenseFile)) {
      archive.file(licenseFile, { name: 'LICENSE.nodejs.txt' });
    }

    // Add launch script (virtual file)
    archive.append(scriptContent, { name: scriptName });

    await archive.finalize();
    console.log(`✅ ${zipName} created`);
  } catch (error) {
    console.error(`❌ Failed to create ${zipName}:`, error);
    throw error;
  }
}

// Main process
async function main(): Promise<void> {
  try {
    // Clean and recreate output directory
    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    const platforms = await getAvailablePlatforms();

    if (platforms.length === 0) {
      console.warn(
        '⚠️ No runtime platforms found. Please run download-runtime.ts first.'
      );
      return;
    }

    // Process platforms concurrently for better performance
    const zipPromises = platforms.map(createZip);
    await Promise.all(zipPromises);

    console.log(`🎉 Successfully created ${platforms.length} platform packages`);
  } catch (error) {
    console.error('❌ Failed to package runtime:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
