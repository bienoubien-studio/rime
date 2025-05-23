import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'rizom/api': './src/lib/api.js',
			'$lib': './src/lib',
			rizom: './src/lib'
		}
	}
};

export default config;
