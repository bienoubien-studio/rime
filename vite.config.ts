import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { rime } from './src/lib/core/dev/vite/index.js';

export default defineConfig({
	plugins: [sveltekit(), rime()],

	server: {
		host: process.env.DEV_HOST || 'localhost'
	},
	optimizeDeps: {
		exclude: ['sharp'],
		include: ['@lucide/svelte']
	},
	ssr: {
		external: ['sharp']
	},
	build: {
		rollupOptions: {
			external: ['sharp']
		}
	},

	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined
});
