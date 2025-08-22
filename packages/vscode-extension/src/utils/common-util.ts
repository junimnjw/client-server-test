import { ChildProcess, exec, spawn } from "child_process";
import { readFile } from "fs";
import { workspace } from "vscode";

// child process utils
export function execChildProcess(
  command: string,
  workingDirectory?: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!workingDirectory) {
      console.log(
        'Workspace root is not defined, using temporary directory as working directory'
      );
      const os = require('os');
      workingDirectory = os.tmpdir() as string;
      // Decide if you want to reject here or proceed with temp dir.
      // If you want to reject if no workspace and no explicit dir, uncomment:
      // reject(new Error('Working directory is not defined'));
    }
    exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(`Command execution failed: ${command} - ${stderr || error.message}`)
        );
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Spawns child process
 * @param command
 * @param [args]
 * @param [workingDirectory]
 * @param [showLog]
 * @param [preLaunchMsg]
 * @param [postLaunchMsg]
 * @param [outputCb]
 * @returns child process
 */
export function spawnChildProcess(
  command: string,
  args: Array<string> = [],
  workingDirectory?: string,
  showLog: boolean = false,
  preLaunchMsg: string = '',
  postLaunchMsg: string = '',
  outputCb: ((process: ChildProcess, output: string) => void) | null = null
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!workingDirectory) {
      console.log(
        'Workspace root is not defined, using temporary directory as working directory'
      );
      const os = require('os');
      workingDirectory = os.tmpdir() as string;
      // Decide if you want to reject here or proceed with temp dir.
      // If you want to reject if no workspace and no explicit dir, uncomment:
      // reject(new Error('Working directory is not defined'));
    }
    const _childProcess = spawn(command, args, { cwd: workingDirectory });
    let output = '';

    if (preLaunchMsg) {
      console.log(preLaunchMsg);
    }

    _childProcess.stdout.on('data', (data) => {
      output += data;
      if (showLog) {
        console.log(data.toString());
      }
    });

    _childProcess.stderr.on('data', (data) => {
      output += data;
      if (showLog) {
        console.error(data.toString());
      }
    });

    _childProcess.on('close', (code) => {
      if (code === 0) {
        if (postLaunchMsg) {
          console.log(postLaunchMsg);
        }
        resolve(output);
      } else {
        reject(new Error(output));
      }
    });
    if (outputCb) {
      outputCb(_childProcess, output);
    }
  });
}

export function dateToProfilerFormat(date: Date): string {
  // 'yyyyMMdd-HHmmss'
  let yyyy = date.getFullYear().toString();
  let MM = (date.getMonth() + 1).toString();
  MM = MM.length === 1 ? '0' + MM : MM;
  let dd = date.getDate().toString();
  dd = dd.length === 1 ? '0' + dd : dd;
  let HH = date.getHours().toString();
  HH = HH.length === 1 ? '0' + HH : HH;
  let mm = date.getMinutes().toString();
  mm = mm.length === 1 ? '0' + mm : mm;
  let ss = date.getSeconds().toString();
  ss = ss.length === 1 ? '0' + ss : ss;
  return yyyy + MM + dd + '-' + HH + mm + ss;
}

export async function fileRead(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(new Error(err.toString()));
      } else {
        resolve(data);
      }
    });
  });
}

export async function isTizenWorkspace(): Promise<boolean> {
  const include = `{**/tizen-manifest.xml,**/config.xml,**/tizen_native_project.yaml,**/tizen_dotnet_project.yaml,**/project_def.prop}`;
  const exclude = '{**/node_modules/**,**/.git/**,**/bower_components/**}';
  const resources = await workspace.findFiles(/*include*/ include, /*exclude*/ exclude, 1);
  return resources.length > 0;
}
