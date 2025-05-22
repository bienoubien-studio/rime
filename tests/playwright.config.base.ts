import { type PlaywrightTestConfig, defineConfig } from '@playwright/test';
import path from 'path'

type Args = {
	name: string;
};

export function createPlaywrightConfig({ name }: Args): PlaywrightTestConfig {
	return defineConfig({
		workers: 1,
		webServer: {
			command: `pnpm rizom:use ${name} && pnpm vite dev`,
			port: 5173,
			stdout: 'ignore',
			stderr: 'ignore'
		},
		expect: {
			timeout: 30000
		},
		use: {
			baseURL: 'http://rizom.test:5173',
			extraHTTPHeaders: {
				origin: 'http://rizom.test:5173'
			}
		},
		projects: [
			{
				name: 'setup',
				testDir: path.join(process.cwd(), './tests'),
				testMatch: /setup\.test\.ts/
			},
			{
				name: 'tests',
				dependencies: ['setup'],
				testDir: path.join(process.cwd(), `./tests/${name}`),
				testMatch: /^.*\.test\.ts$/

				// testMatch: /pages\.test\.ts/
			}
		]
	});
}
