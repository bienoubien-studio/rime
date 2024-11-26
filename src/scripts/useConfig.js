import { program } from 'commander';
import { execSync } from 'child_process';

program.version('0.1').description('CMS utilities');

const projectRoot = process.cwd();

program
	// .command('use')
	.description('Use a specific config')
	.argument('<name>', 'Specify the name')
	.action((name) => {
		try {
			execSync('pnpm rizom reset --force');
			execSync(`pnpm rizom init -s --name ${name}`);
			execSync(
				`cp -f ${projectRoot}/tests/${name}/rizom.config.txt ${projectRoot}/src/config/rizom.config.ts`
			);
			execSync(`pnpm rizom generate --force`);
		} catch (error) {
			console.error('Error setting configuration:', error);
		}
	});

program.parse(process.argv);
