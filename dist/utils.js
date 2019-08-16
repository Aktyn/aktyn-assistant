"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
function executeCommand(cmd, timeout = 1000 * 60 * 5) {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let expired = false;
        setTimeout(() => {
            expired = true;
            reject('Command timeout');
        }, timeout);
        try {
            let args = cmd.split(' ');
            let main_cmd = args.shift() || 'echo';
            const command = child_process_1.spawn(main_cmd, args, { shell: true });
            command.stdout.on('data', (data) => stdout += data);
            command.stderr.on('data', (data) => stderr += data);
            command.on('close', (code) => {
                if (expired)
                    return;
                if (code === 0)
                    resolve(stdout);
                else
                    reject(stderr);
            });
            command.on('error', (err) => {
                if (!expired)
                    reject(err);
            });
        }
        catch (e) {
            if (!expired)
                reject(e);
        }
    });
}
exports.executeCommand = executeCommand;
