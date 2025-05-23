import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from './src/lib/core/dev/vite/index.js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), rizom()],

	server: {
		host: 'rizom.test'
	},
	optimizeDeps: { 
		exclude: ['sharp', 'better-sqlite3'],
		include: ['@lucide/svelte']
	},
	ssr: {
		external: ['sharp']
	},
	build: {
		rollupOptions: {
			external: ['better-sqlite3', 'sharp']
		}
	},

	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined,

	test: {
		include: ['src/**/*.{spec}.{js,ts}']
	}
});
