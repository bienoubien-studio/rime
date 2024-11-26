#!/usr/bin/env bun
import { program } from 'commander';
import { init } from './init/index.js';
import { generate } from './generate.js';
import { execSync } from 'child_process';
import { confirm, outro } from '@clack/prompts';

program.version('0.1').description('CMS utilities');

program
	.command('init')
	.description('Initialize CMS')
	.option('-f, --force', 'Force init with default package name', false)
	.option('-s, --skip-install', 'Skip dependencies installation', false)
	.option('-n, --name <name>', 'Specify the name')
	.action((args) => {
		init(args);
	});

program
	.command('generate')
	.description('Generate schema, types and routes from config file')
	.option('-f, --force', 'Force generation overwriting existing files', false)
	.action((args) => generate(args.force));

program
	.command('reset')
	.description('Reset CMS')
	.option('-f, --force', 'Force generation overwriting existing files', false)
	.action(async (args) => {
		let confirmed = true;
		if (!args.force) {
			confirmed = (await confirm({
				message: `Are you sure you want to delete all related rizom files, including the static/medias folder and database ?`
			})) as boolean;
		}
		if (!confirmed) {
			return outro('Operation cancelled. Goodbye!');
		}
		execSync('rm -fr ./.rizom');
		execSync('rm -fr ./src/routes/\\(rizom\\)');
		execSync('rm -fr ./db');
		execSync('rm -fr ./static/medias');
		execSync('rm -f ./src/app.generated.d.ts');
		execSync('rm -f ./src/lib/rizom.config.browser.js');
		execSync('rm -f ./src/lib/server/schema.ts');
		execSync('rm -f ./drizzle.config.ts');
		if (args.force) {
			return console.log('rizom cleaned');
		} else {
			return outro('Everything deleted Goodbye!');
		}
	});

program.parse(process.argv);
