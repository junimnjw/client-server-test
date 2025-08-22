//src/server/server-listing.ts
/* Minimal HTML directory listing parser for latest server zip */
import * as https from 'https';
import * as http from 'http';
import semver from 'semver';
import { logInfo } from '../utils/logger';

export interface LatestZip {
  version: string;
  fileName: string;
}

/** Map Node's process.platform to packaging token */
function platformToken(): 'win' | 'darwin' | 'linux' {
  if (process.platform === 'win32') return 'win';
  if (process.platform === 'darwin') return 'darwin';
  return 'linux';
}

/** Map Node's process.arch to packaging token */
function archToken(): 'x64' | 'arm64' {
  return process.arch === 'arm64' ? 'arm64' : 'x64';
}

/** HTTP(S) GET text */
function fetchText(url: string): Promise<string> {
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    client
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} on ${url}`));
          return;
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

/** Safe URL join (avoid double slashes) */
export function joinUrl(base: string, file: string): string {
  return `${base.replace(/\/+$/, '')}/${file.replace(/^\/+/, '')}`;
}

/**
 * Enhanced version comparison that properly handles pre-release versions
 */
function compareVersions(a: string, b: string): number {
  // First try direct semver comparison
  if (semver.valid(a) && semver.valid(b)) {
    return semver.compare(a, b);
  }

  // If one is valid semver, it's considered newer
  if (semver.valid(a) && !semver.valid(b)) return 1;
  if (!semver.valid(a) && semver.valid(b)) return -1;

  // If neither is valid semver, try to coerce
  const coercedA = semver.coerce(a);
  const coercedB = semver.coerce(b);

  if (coercedA && coercedB) {
    return semver.compare(coercedA.version, coercedB.version);
  }

  // Last resort: string comparison
  return a.localeCompare(b);
}

/**
 * Parse directory listing HTML at baseUrl and pick the latest zip
 * for current OS/arch using enhanced semver-aware comparison.
 */
export async function fetchLatestForCurrentPlatform(baseUrl: string): Promise<LatestZip> {
  const html = await fetchText(baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');

  // Enhanced regex to capture more complex pre-release versions
  // Supports: 2.0.0-alpha.2, 2.0.0-alpha.2-candidate, 2.0.0-beta.1, etc.
  const re =
    /tizen-extension-server-(\d+\.\d+\.\d+(?:-[0-9A-Za-z-._]+)*)-(win|darwin|linux)-(x64|arm64)\.zip/gi;

  const wantPlat = platformToken();
  const wantArch = archToken();

  // Use Set to prevent duplicates based on unique key
  const uniqueFiles = new Set<string>();
  const all: { versionRaw: string; fileName: string; plat: string; arch: string }[] = [];

  // Parse HTML content for file matching

  // Use matchAll instead of exec to get all matches at once and prevent duplicates
  const matches = html.matchAll(re);

  for (const match of matches) {
    const versionRaw = match[1];
    const fileName = match[0];
    const platform = match[2];
    const arch = match[3];

    // Create unique key to prevent duplicates
    const uniqueKey = `${fileName}`;

    if (uniqueFiles.has(uniqueKey)) {
      continue;
    }

    // More lenient validation - allow complex pre-release versions
    if (!semver.valid(versionRaw) && !semver.coerce(versionRaw)) {
      logInfo(`[ServerListing] Skipping invalid version: ${versionRaw}`);
      continue;
    }

    uniqueFiles.add(uniqueKey);
    all.push({
      versionRaw,
      fileName,
      plat: platform,
      arch,
    });
  }

  // Found files for processing

  // 1) exact OS+arch
  let pool = all.filter((x) => x.plat === wantPlat && x.arch === wantArch);

  // 2) fallback: OS only
  if (pool.length === 0) {
    pool = all.filter((x) => x.plat === wantPlat);
  }

  // 3) last resort: any
  if (pool.length === 0) {
    pool = all;
  }

  if (pool.length === 0) {
    throw new Error(
      `No server zip found at listing for platform=${wantPlat}, arch=${wantArch}`
    );
  }

  // Enhanced sorting with proper semver comparison
  pool.sort((a, b) => compareVersions(b.versionRaw, a.versionRaw));

  const best = pool[0];
  logInfo(`[ServerListing] Selected best version: ${best.versionRaw}`);

  return { version: best.versionRaw, fileName: best.fileName };
}
