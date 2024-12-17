import { sveltekit } from '@sveltejs/kit/vite';
import { rizom } from './src/lib/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [rizom(), sveltekit()],
	server: {
		host: 'rizom.test'
	},
	build: {
		rollupOptions: {
			external: ['@node-rs/argon2']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
