#!/usr/bin/env node
// @ts-check
import { program } from 'commander';
import { init } from './init/index.js';
import { confirm, outro } from '@clack/prompts';
import { rmSync } from 'fs';
import path from 'path';

program.version('0.1').description('CMS utilities');

program
	.command('init')
	.description('Initialize CMS')
	.option('-f, --force', 'Force init with default package name', false)
	.option('-n, --name <name>', 'Specify the name')
	.action((args) => {
		init(args);
	});

program
	.command('generate')
	.description('Generate schema, types and routes from config file')
	.option('-f, --force', 'Force generation overwriting existing files', false)
	.action(async (args) => {
		const { generate } = await import('./generate.js');
		generate(args.force);
	});

program
	.command('reset')
	.description('Reset CMS')
	.option('-f, --force', 'Force generation overwriting existing files', false)
	.action(async (args) => {
		let shouldProceed = true;
		if (!args.force) {
			const response = await confirm({
				message: `Are you sure you want to delete all related rizom files, including the static/medias folder and database ?`
			});
			shouldProceed = response === true;
		}
		if (!shouldProceed) {
			return outro('Operation cancelled. Goodbye!');
		}

		// Remove directories
		rmSync(path.join('.rizom'), { recursive: true, force: true });
		rmSync(path.join('src', 'routes', '(rizom)'), { recursive: true, force: true });
		rmSync(path.join('db'), { recursive: true, force: true });
		rmSync(path.join('static', 'medias'), { recursive: true, force: true });
		// Remove files
		rmSync(path.join('src', 'app.generated.d.ts'), { force: true });
		rmSync(path.join('src', 'lib', 'rizom.config.browser.js'), { force: true });
		rmSync(path.join('src', 'lib', 'server', 'schema.ts'), { force: true });
		rmSync(path.join('drizzle.config.ts'), { force: true });

		if (args.force) {
			return console.log('rizom cleaned');
		} else {
			return outro('rizom cleaned');
		}
	});

program.parse(process.argv);
