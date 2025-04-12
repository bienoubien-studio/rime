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
			const configDirPath = path.join(projectRoot, 'src', 'config');
			const frontRoutesPath = path.join(projectRoot, 'src', 'routes', '\\(front\\)');

			// Delete previous
			execSync('bun ./src/lib/bin/index.ts clear --force');
			execSync(`rm -fr ${frontRoutesPath}`);

			// Init files and DB
			execSync(`bun ./src/lib/bin/index.ts init --name ${name}`);

			// Copy entire config directory
			const testConfigDirPath = path.join(projectRoot, 'tests', name, 'config');

			if (existsSync(testConfigDirPath)) {
				// Remove existing config directory content
				execSync(`rm -fr ${configDirPath}/*`);
				// Copy the entire config directory
				execSync(`cp -rf ${testConfigDirPath}/* ${configDirPath}/`);
			} else {
				console.warn(`Warning: Config directory not found for ${name}`);
			}
			
			// Copy routes
			const testFrontRoutesPath = path.join(projectRoot, 'tests', name, 'routes', '\\(front\\)');

			if (existsSync(testFrontRoutesPath.replace(/\\/g, ''))) {
				execSync(`cp -rf ${testFrontRoutesPath} ${frontRoutesPath}`);
			}
			// Generate
			const stdout = execSync(`bun ./src/lib/bin/index.ts generate --force`);
			if(stdout.toString().includes('Generation completed successfully')){
				console.log('Successfull files generation and database pushed')
			}
			
		} catch (error) {
			console.error('Error setting configuration:', error);
		}
	});

program.parse(process.argv);
