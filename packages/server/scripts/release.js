//src/scripts/release.js
/* eslint-disable no-console */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants for better maintainability
const ZIP_FILE_PATTERN = /\.zip$/;

// Utility functions with improved error handling
function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', ...opts });
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    throw error;
  }
}

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function readJson(p) {
  try {
    const content = await fs.readFile(p, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read JSON file: ${p}`);
    throw error;
  }
}

async function copyFileAsync(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function moveAllAsync(srcDir, destDir, pattern = /.*/) {
  await ensureDir(destDir);

  let files = [];
  try {
    files = await fs.readdir(srcDir);
  } catch {
    return [];
  }

  const moved = [];
  const movePromises = [];

  for (const file of files) {
    if (!pattern.test(file)) continue;

    const from = path.join(srcDir, file);
    const to = path.join(destDir, file);

    try {
      const stat = await fs.stat(from);
      if (stat.isFile()) {
        movePromises.push(
          copyFileAsync(from, to)
            .then(() => {
              moved.push({ from, to });
              return fs.unlink(from); // Remove source after copy
            })
            .catch((error) => {
              console.error(`❌ Failed to move ${file}:`, error.message);
              throw error;
            })
        );
      }
    } catch (error) {
      console.warn(`⚠️ Skipping ${file}: ${error.message}`);
    }
  }

  // Wait for all moves to complete
  await Promise.all(movePromises);
  return moved;
}

function arg(k, fallback) {
  const v = process.argv.find((a) => a.startsWith(`--${k}=`));
  if (v) return v.split('=').slice(1).join('=');
  return process.env[k.toUpperCase()] || fallback;
}

function lsTree(cwd, dir) {
  const cmd = process.platform === 'win32' ? `dir /s /b ${dir}` : `ls -R ${dir}`;
  run(cmd, { cwd });
}

// Optimized server info injection with parallel processing
async function injectServerInfo(version, outDir) {
  console.log('\n📝 Creating server-info.json and injecting into zip files...');

  const serverInfo = {
    version,
    downloadUrl: `https://github.sec.samsung.net/developer-interface/tizen.extension.v2/releases/download/tizen-extension-server@${version}/server-${version}.zip`,
    releaseDate: new Date().toISOString(),
  };

  const serverInfoJson = JSON.stringify(serverInfo, null, 2);
  const serverInfoBuffer = Buffer.from(serverInfoJson);

  try {
    // Get all zip files
    const outFiles = (await fs.readdir(outDir)).filter((f) => f.endsWith('.zip'));

    if (outFiles.length === 0) {
      console.warn('⚠️ No zip files found to process');
      return [];
    }

    console.log(`📦 Processing ${outFiles.length} zip files in parallel...`);

    // Process all zip files in parallel for better performance
    const AdmZip = require('adm-zip');
    const processPromises = outFiles.map(async (zipFile) => {
      const zipPath = path.join(outDir, zipFile);

      try {
        const zip = new AdmZip(zipPath);
        zip.addFile('server-info.json', serverInfoBuffer);
        await fs.writeFile(zipPath, zip.toBuffer());
        console.log(`✅ Added server-info.json to ${zipFile}`);
        return zipFile;
      } catch (error) {
        console.error(`❌ Failed to add server-info.json to ${zipFile}:`, error.message);
        throw error;
      }
    });

    const results = await Promise.all(processPromises);
    console.log(`✅ Successfully processed ${results.length} zip files`);
    return results;
  } catch (error) {
    console.error('❌ Failed to inject server info:', error.message);
    throw error;
  }
}

// Main process with improved error handling and performance
async function main() {
  try {
    const root = path.join(__dirname, '..');
    const pkg = await readJson(path.join(root, 'package.json'));
    const version = pkg.version;

    const outDir = path.join(root, 'out');
    const runtimeDir = path.join(root, 'runtime');
    const releaseDir = path.join(root, 'release');

    console.log(`🚀 Starting release process for version ${version}`);

    // 0) Prepare directories
    await ensureDir(releaseDir);

    // 1) Build
    run('pnpm run build', { cwd: root });

    // 2) Download runtime (places platform runtimes under runtime/)
    run('pnpm tsx scripts/download-runtime.ts', { cwd: root });

    // 3) Package runtimeserver (creates out/*.zip)
    run('pnpm tsx scripts/package-runtime.ts', { cwd: root });

    // 3.5) Clean up runtime folder after packaging (no longer needed)
    console.log('\n🧹 Cleaning up runtime folder after packaging...');
    try {
      if (fsSync.existsSync(runtimeDir)) {
        await fs.rm(runtimeDir, { recursive: true, force: true });
        console.log('✅ Runtime folder cleaned up');
      }
    } catch (error) {
      console.warn('⚠️ Failed to cleanup runtime folder:', error.message);
    }

    // 4) Create server-info.json and inject into zip files
    const outFiles = await injectServerInfo(version, outDir);

    // 5) Validate out/
    try {
      await fs.access(outDir);
    } catch {
      throw new Error('❌ Missing out/ directory. package-runtime may have failed.');
    }

    if (outFiles.length === 0) {
      throw new Error(
        '❌ No out/*.zip files were produced. Please check scripts/package-runtime.ts.'
      );
    }

    // 6) Move out/*.zip -> release/ with improved error handling
    const moved = await moveAllAsync(outDir, releaseDir, ZIP_FILE_PATTERN);
    if (moved.length === 0) {
      throw new Error('❌ Nothing to move. Check out/*.zip.');
    }

    for (const { to } of moved) {
      console.log(`📦 ${path.basename(to)} -> release/`);
    }

    // 7) Print tree (optional) - only if runtime exists
    if (fsSync.existsSync(runtimeDir)) {
      console.log('\n=== runtime tree ===');
      lsTree(root, 'runtime');
    }

    console.log('\n=== out tree ===');
    if (process.platform === 'win32') {
      run('dir /b out', { cwd: root });
    } else {
      run('ls -l out', { cwd: root });
    }

    // 8) Done
    console.log('\n✅ Local release ready!');
    console.log(`   - version: ${version}`);
    console.log(`   - release dir: ${releaseDir}`);
    console.log('   - included files:');

    const releaseFiles = await fs.readdir(releaseDir);
    for (const file of releaseFiles) {
      console.log(`     • ${file}`);
    }

    console.log(`\n🎉 Successfully processed ${moved.length} packages`);
  } catch (error) {
    console.error('❌ Release process failed:', error.message);
    process.exit(1);
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

// Run main function
main().catch((error) => {
  console.error('❌ Fatal error in main process:', error);
  process.exit(1);
});
