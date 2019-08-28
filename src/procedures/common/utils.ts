import {spawn} from 'child_process';

export function executeCommand(cmd: string, timeout = 1000 * 60 * 5): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = '';
		let stderr = '';
		
		let expired = false;
		
		setTimeout(() => {
			expired = true;
			reject('Command timeout');
		}, timeout);//timeout after 5 minutes
		
		try {
			let args = cmd.split(' ');
			let main_cmd = args.shift() || 'echo';
			const command = spawn(main_cmd, args, {shell: true});
			command.stdout.on('data', (data: string) => stdout += data);
			command.stderr.on('data', (data: string) => stderr += data);
			command.on('close', (code: number) => {
				if (expired) return;
				if (code === 0)
					resolve(stdout);
				else
					reject(stderr);
			});
			command.on('error', (err: any) => {
				if (!expired)
					reject(err);
			});
		} catch (e) {
			if (!expired)
				reject(e);
		}
	});
}