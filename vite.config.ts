import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from './src/lib/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), rizom()],

	server: {
		host: 'rizom.test'
	},
	optimizeDeps: { exclude: ['sharp', 'better-sqlite3'] },
	ssr: {
		external: ['sharp']
	},
	build: {
		rollupOptions: {
			external: ['better-sqlite3', 'sharp']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
