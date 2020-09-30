import { exec } from 'child_process';

export function executeCommand(cmd: string, timeout = 1000 * 60 * 5): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let expired = false;

    setTimeout(() => {
      expired = true;
      reject('Command timeout');
    }, timeout); //timeout after default 5 minutes

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);

      if (expired) return;

      resolve({ stdout, stderr });
    });
  });
}

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
