import { program } from 'commander';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

program.version('0.1').description('CMS utilities');

const projectRoot = process.cwd();

program
	.description('Use a specific config')
	.argument('<name>', 'Specify the name')
	.action((name) => {
		try {
			const configPath = path.join(projectRoot, 'src', 'config', 'rizom.config.ts');
			const frontRoutesPath = path.join(projectRoot, 'src', 'routes', '\\(front\\)');

			// Delete previous
			execSync('pnpm rizom reset --force');
			execSync(`rm -fr ${frontRoutesPath}`);

			// Init files and DB
			execSync(`pnpm rizom init -s --name ${name}`);

			// Copy config
			const testConfigPath = path.join(projectRoot, 'tests', name, 'rizom.config.txt');

			execSync(`cp -f ${testConfigPath} ${configPath}`);

			// Copy routes
			const testFrontRoutesPath = path.join(projectRoot, 'tests', name, 'routes', '\\(front\\)');

			if (existsSync(testFrontRoutesPath.replace(/\\/g, ''))) {
				execSync(`cp -rf ${testFrontRoutesPath} ${frontRoutesPath}`);
			}
			// Generate
			execSync(`pnpm rizom generate --force`);
		} catch (error) {
			console.error('Error setting configuration:', error);
		}
	});

program.parse(process.argv);
