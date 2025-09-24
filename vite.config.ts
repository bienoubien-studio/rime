import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { rizom } from './src/lib/core/dev/vite/index.js';

export default defineConfig({
	plugins: [sveltekit(), rizom()],

	server: {
		host: process.env.DEV_HOST || 'localhost'
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
		: undefined
});
