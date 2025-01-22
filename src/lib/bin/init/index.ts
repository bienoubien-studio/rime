#!/usr/bin/env node
// @ts-check
import { program } from 'commander';
import { init } from './command/index.js';

program.version('0.1').description('CMS utilities');

program
	.description('Initialize CMS')
	.option('-s, --skip-install', 'Skip dependencies installation', false)
	.option('-f, --force', 'Force init with default package name', false)
	.option('-n, --name <name>', 'Specify the name')
	.action((args) => {
		init(args);
	});

program.parse(process.argv);
