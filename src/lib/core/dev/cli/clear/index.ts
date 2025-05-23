import { confirm, outro } from '@clack/prompts';
import { rmSync } from 'fs';
import path from 'path';

const clearMessage = `Are you sure you want to delete all related rizom files, including : 
- routes/(rizom) 
- static/medias folder 
- database folder
- src/lib/server/schema.ts
- src/app.generated.d.ts
- src/hooks.server.ts
- drizzle.config.ts
`

export const clear = async (args: { force?: boolean }) => {
	let shouldProceed = true;
	if (!args.force) {
		const response = await confirm({
			message: clearMessage
		});
		shouldProceed = response === true;
	}
	if (!shouldProceed) {
		return outro('Operation cancelled. Great!');
	}
	// Remove directories
	rmSync(path.join('.rizom'), { recursive: true, force: true });
	rmSync(path.join('src', 'routes', '(rizom)'), { recursive: true, force: true });
	rmSync(path.join('db'), { recursive: true, force: true });
	rmSync(path.join('static', 'medias'), { recursive: true, force: true });
	// Remove files
	rmSync(path.join('src', 'hooks.server.ts'), { force: true });
	rmSync(path.join('src', 'app.generated.d.ts'), { force: true });
	rmSync(path.join('src', 'lib', 'server', 'schema.ts'), { force: true });
	rmSync(path.join('drizzle.config.ts'), { force: true });
	if (args.force) {
		return console.info('rizom cleared');
	}
	else {
		return outro('rizom cleared');
	}
}