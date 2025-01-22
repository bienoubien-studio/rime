#!/usr/bin/env bun
// @ts-check
import { program } from 'commander';

program.version('0.1').description('rizom utilities');

program
	.description('Generate schema, types and routes from config file')
	.option('-f, --force', 'Force generation overwriting existing files', false)
	.action(async (args) => {
		const { generate } = await import('./generate.js');
		generate(args.force);
	});

program.parse(process.argv);
