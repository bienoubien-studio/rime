#!/usr/bin/env node
// @ts-check
import { program } from 'commander';
import { init } from './command/index.js';

program.version('0.1').description('CMS utilities');

program
	.description('Initialize CMS')
	.option('-n, --name <name>', 'Will be the database name')
	.option('-f, --force', 'Force init with default package name', false)
	.action((args) => {
		init(args);
	});

program.parse(process.argv);
