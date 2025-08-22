//src/scripts/download-runtime.ts
import { mkdir, rm, chmod, writeFile } from 'fs/promises';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { get } from 'https';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import * as tar from 'tar';
import lzma from 'lzma-native';

// Constants for better maintainability
const NODE_VERSION = '22.16.0';
const TEMP_DIR = join(os.tmpdir(), `node-runtime-${Date.now()}`);
const RUNTIME_BASE_DIR = join(__dirname, '..', 'runtime');
const NODE_BINARY_REL_PATH = 'bin/node';
const LAUNCHER_PERMISSIONS = 0o755;
const DOWNLOAD_TIMEOUT_MS = 30000;

const platforms = ['win', 'linux', 'darwin'];
const architectures = ['x64', 'arm64'];

// Platform-specific configurations
const PLATFORM_CONFIG = {
  win: { ext: 'zip', binaryName: 'node.exe', extractor: 'zip' },
  linux: { ext: 'tar.xz', binaryName: 'node', extractor: 'tar' },
  darwin: { ext: 'tar.xz', binaryName: 'node', extractor: 'tar' },
} as const;

// Utility functions
function getArchiveName(platform: string, arch: string): string {
  const ext = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]?.ext || 'tar.xz';
  return `node-v${NODE_VERSION}-${platform}-${arch}.${ext}`;
}

function getDownloadUrl(platform: string, arch: string): string {
  return `https://nodejs.org/dist/v${NODE_VERSION}/${getArchiveName(platform, arch)}`;
}

function getPaths(platform: string, arch: string) {
  const archiveName = getArchiveName(platform, arch);
  const archivePath = join(TEMP_DIR, archiveName);
  const tarPath = join(TEMP_DIR, `node-${platform}-${arch}.tar`);
  const extractDir = join(TEMP_DIR, `untar-${platform}-${arch}`);
  const outputDir = join(RUNTIME_BASE_DIR, `${platform}-${arch}`);

  return { archiveName, archivePath, tarPath, extractDir, outputDir };
}

async function download(url: string, destPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Download timeout after ${DOWNLOAD_TIMEOUT_MS / 1000} seconds`));
    }, DOWNLOAD_TIMEOUT_MS);

    get(url, (res) => {
      clearTimeout(timeout);

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${url} (status ${res.statusCode})`));
      }

      res.pipe(createWriteStream(destPath)).on('finish', resolve).on('error', reject);
    }).on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function extractFromZip(zipPath: string, destDir: string): Promise<void> {
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith('node.exe'));

  if (!entry) {
    throw new Error('node.exe not found in ZIP archive');
  }

  await writeFile(join(destDir, 'node.exe'), entry.getData());
}

async function extractFromTarXz(
  archivePath: string,
  tarPath: string,
  extractDir: string,
  destDir: string,
  platform: string,
  arch: string
): Promise<void> {
  // Decompress .tar.xz to .tar
  await new Promise<void>((resolve, reject) => {
    createReadStream(archivePath)
      .pipe(lzma.createDecompressor())
      .pipe(createWriteStream(tarPath))
      .on('close', resolve)
      .on('error', reject);
  });

  await mkdir(extractDir, { recursive: true });

  // Extract tar file
  await tar.extract({
    file: tarPath,
    cwd: extractDir,
    preservePaths: false,
  });

  const nodePath = join(
    extractDir,
    `node-v${NODE_VERSION}-${platform}-${arch}`,
    NODE_BINARY_REL_PATH
  );
  const outputPath = join(destDir, 'node');

  if (!existsSync(nodePath)) {
    throw new Error(`Node binary not found at expected path: ${nodePath}`);
  }

  // Copy and set permissions
  await pipeline(createReadStream(nodePath), createWriteStream(outputPath));
  await chmod(outputPath, LAUNCHER_PERMISSIONS);
}

async function extractNodeBinary(
  platform: string,
  arch: string,
  archivePath: string,
  paths: ReturnType<typeof getPaths>
): Promise<void> {
  await mkdir(paths.outputDir, { recursive: true });

  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  const isWindows = config?.extractor === 'zip';

  isWindows
    ? await extractFromZip(archivePath, paths.outputDir)
    : await extractFromTarXz(
        archivePath,
        paths.tarPath,
        paths.extractDir,
        paths.outputDir,
        platform,
        arch
      );
}

async function cleanTemp(): Promise<void> {
  existsSync(TEMP_DIR) && (await rm(TEMP_DIR, { recursive: true, force: true }));
}

async function cleanRuntime(): Promise<void> {
  existsSync(RUNTIME_BASE_DIR) &&
    (await rm(RUNTIME_BASE_DIR, { recursive: true, force: true }));
}

async function cleanOutput(outputDir: string): Promise<void> {
  existsSync(outputDir) && (await rm(outputDir, { recursive: true, force: true }));
}

async function processOne(platform: string, arch: string): Promise<void> {
  const paths = getPaths(platform, arch);
  const downloadUrl = getDownloadUrl(platform, arch);

  console.log(`⬇️ ${platform}-${arch}: ${downloadUrl}`);

  try {
    await cleanOutput(paths.outputDir);
    await download(downloadUrl, paths.archivePath);
    console.log(`📦 Extracting ${paths.archiveName}`);
    await extractNodeBinary(platform, arch, paths.archivePath, paths);
    console.log(`✅ Runtime ready: ${paths.outputDir}`);
  } catch (error) {
    console.error(`❌ Failed for ${platform}-${arch}:`, error);
    throw error; // Re-throw to handle in main
  }
}

async function main(): Promise<void> {
  try {
    await mkdir(TEMP_DIR, { recursive: true });

    // Process all platforms concurrently for better performance
    const tasks = platforms.flatMap((platform) =>
      architectures.map((arch) => processOne(platform, arch))
    );

    await Promise.all(tasks);

    console.log(
      `🎉 Successfully processed ${
        platforms.length * architectures.length
      } runtime combinations`
    );
  } catch (error) {
    console.error('❌ Runtime download failed:', error);
    process.exit(1);
  } finally {
    await cleanTemp();
    // Note: runtime folder is not cleaned here as package-runtime.ts needs it
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
