import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'rizom/panel/auth/client': './src/lib/panel/pages/auth/index.js',
			'rizom/panel/auth': './src/lib/panel/pages/auth/index.server.js',
			'rizom/panel/client': './src/lib/panel/index.js',
			'rizom/i18n': './src/lib/core/i18n',
			'rizom/api': './src/lib/core/api/index.server.js',
			'rizom/config/server': './src/lib/core/config/server/index.server.js',
			'rizom/config/client': './src/lib/core/config/client/index.js',
			'rizom/fields/richText': './src/lib/fields/rich-text/client.js',
			$lib: './src/lib',
			rizom: './src/lib'
		}
	}
};

export default config;
