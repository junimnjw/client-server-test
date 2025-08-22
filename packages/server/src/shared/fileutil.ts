import * as fs from 'fs';
import { PathLike, symlink } from 'fs';
import * as path from 'path';
import { copySync } from 'fs-extra';

export class FileUtil {
  //private filePath: string = '';
  private static instance: FileUtil | null = null;

  private constructor() {}

  public static getInstance() {
    if (this.instance === null) {
      this.instance = new this();
    }
    return this.instance;
  }

  checkFileExists(strpath: string) {
    try {
      if (fs.existsSync(strpath)) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(`Error ${strpath} does not exist - ${err}`);
      return false;
    }
  }

  checkDirExists(strDirPath: string) {
    try {
      if (fs.existsSync(strDirPath)) {
        const statsObj = fs.statSync(strDirPath);
        if (statsObj.isDirectory()) {
          return true;
        }
        return false;
      } else {
        return false;
      }
    } catch (err) {
      console.error(`Error ${strDirPath} does not exist - ${err}`);
      return false;
    }
  }

  createDir(strDirPath: string) {
    try {
      fs.mkdirSync(strDirPath, {
        recursive: true,
        mode: 0o755, // rwxr-xr-x permissions
      });
      // Set permissions explicitly in case umask modified them
      fs.chmodSync(strDirPath, 0o755);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error creating directory ${strDirPath}: ${err.message}`);
        throw err;
      }
      console.error(`Error creating directory ${strDirPath}: ${String(err)}`);
      throw err;
    }
  }

  readDirSync(strDirPath: string) {
    try {
      const dirlist = fs.readdirSync(strDirPath);
      let checkeddirlist: string[] = [];
      for (let i = 0; dirlist && i < dirlist.length; i++) {
        const subDir = path.join(strDirPath, dirlist[i]);
        if (this.checkDirExists(subDir)) {
          checkeddirlist.push(dirlist[i]);
        }
      }
      if (checkeddirlist.length > 0) {
        return checkeddirlist;
      }
      console.error(`Error Read Dir ${strDirPath} No Directory found.`);
      return undefined;
    } catch (err) {
      console.error(`Error Read Dir ${strDirPath} ${err}`);
    }
  }

  deleteDir(targetPath: string): void {
    try {
      if (fs.existsSync(targetPath)) {
        const stat = fs.lstatSync(targetPath);
        if (stat.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: string }).code;
        if (code !== 'ENOENT') {
          console.error(`Error Delete Dir ${targetPath}`, err);
        }
      } else {
        console.error(`Unknown error deleting ${targetPath}`, err);
      }
    }
  }

  deleteFile(targetPath: string): void {
    try {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: string }).code;
        if (code !== 'ENOENT') {
          console.error(`Error Delete File ${targetPath}`, err);
        }
      } else {
        console.error(`Unknown error deleting ${targetPath}`, err);
      }
    }
  }

  fileCopy(srcFilePath: string, destFilePath: string) {
    try {
      fs.copyFileSync(srcFilePath, destFilePath);
    } catch (err) {
      console.error(`Error Copy File ${srcFilePath} ${err}`);
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  fileWrite(filePath: string, text: string | NodeJS.ArrayBufferView): void {
    if (filePath) {
      try {
        fs.writeFileSync(filePath, text, { encoding: 'utf8', flag: 'w' });
      } catch (err) {
        console.error(`Error FileWrite ${filePath} ${err}`);
      }
    }
  }

  fileWriteStream(text: string) {
    try {
      const writer = fs.createWriteStream(text);
      return writer;
    } catch (err) {
      console.error(`Error FileWriteStream ${err}`);
    }
  }

  fileAppend(dirPath: string, text: string): void {
    if (dirPath) {
      try {
        fs.appendFileSync(dirPath, text, { encoding: 'utf8' });
      } catch (err) {
        console.error(`Error fileAppend ${dirPath} ${err}`);
      }
    }
  }

  fileRead(filePath: string): string {
    try {
      return fs.readFileSync(filePath, { encoding: 'utf8' });
    } catch (err) {
      console.error(`Error fileRead ${filePath} ${err}`);
      return '';
    }
  }

  symlinkSync(target: PathLike, path: PathLike, type?: symlink.Type | null) {
    try {
      fs.symlinkSync(target, path, type);
    } catch (err) {
      console.error(`Error symlinkSync ${target} ${err}`);
    }
  }

  chmodSync(filePath: string, mode: number) {
    // Grant both read and write permission to user 0o600
    fs.chmodSync(filePath, mode);
  }

  isExecutable(filepath: string) {
    try {
      fs.accessSync(filepath, fs.constants.X_OK);
      return true;
    } catch (e: any) {
      if (e.code === 'EACCES') {
        console.error(`Permission denied for file ${filepath}: ${e.message}`);
      } else {
        console.error(`Error checking executable status for ${filepath}: ${e.message}`);
      }
      return false;
    }
  }

  searchSubFiles(rootFolder: string, searchfile: string): string[] {
    const findfiles: string[] = [];
    function exploreDirectory(currentPath: string) {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          const sfile = path.join(fullPath, searchfile);
          if (fs.existsSync(sfile)) {
            findfiles.push(sfile);
          }
          exploreDirectory(fullPath);
        }
      }
    }

    exploreDirectory(rootFolder);
    return findfiles;
  }

  copyFolder(src: string, dest: string): boolean {
    try {
      copySync(src, dest);
      console.log('copy folder complete', dest);
      return true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
      } else {
        console.error('Error copy folder', String(error));
      }
    }
    return false;
  }

  assertExistsOrThrow(targetPath: string, type: 'file' | 'dir', context: string): void {
    const exists = fs.existsSync(targetPath);
    const isValid =
      type === 'file'
        ? exists && fs.statSync(targetPath).isFile()
        : exists && fs.statSync(targetPath).isDirectory();

    if (!isValid) {
      throw new Error(
        `${type === 'file' ? 'File' : 'Directory'} not found: ${targetPath} (${context})`
      );
    }
  }
}
