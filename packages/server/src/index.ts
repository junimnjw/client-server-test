// packages/server/src/index.ts
console.log('[🚀 DEBUG] index.ts reached');

import app from './app';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createServer } from 'net';

const DEFAULT_PORT = 12345;
const PORT_FILE = path.join(os.homedir(), '.tizen-extension-server', 'port.txt');

async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const server = createServer();
      await new Promise<void>((resolve, reject) => {
        server.listen(port, '127.0.0.1', () => {
          server.close();
          resolve();
        });
        server.on('error', reject);
      });
      return port;
    } catch {
      continue;
    }
  }
  throw new Error('No available ports found');
}

async function startServer() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    
    // 포트 정보를 파일에 저장
    const portDir = path.dirname(PORT_FILE);
    if (!fs.existsSync(portDir)) {
      fs.mkdirSync(portDir, { recursive: true });
    }
    fs.writeFileSync(PORT_FILE, port.toString());
    
    app.listen(port, '127.0.0.1', () => {
      console.log(`🟢 Server running at http://127.0.0.1:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
