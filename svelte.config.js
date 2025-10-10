import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'@bienbien/rime/panel/auth/client': './src/lib/panel/pages/auth/index.js',
			'@bienbien/rime/panel/auth': './src/lib/panel/pages/auth/index.server.js',
			'@bienbien/rime/panel/client': './src/lib/panel/index.js',
			'@bienbien/rime/panel': './src/lib/panel/index.server.js',
			'@bienbien/rime/panel/*': './src/lib/panel/*',
			'@bienbien/rime/i18n': './src/lib/core/i18n',
			'@bienbien/rime/api': './src/lib/core/api/index.server.js',
			'@bienbien/rime/config/server': './src/lib/core/config/server/index.server.js',
			'@bienbien/rime/config/client': './src/lib/core/config/client/index.js',
			'@bienbien/rime/fields/rich-text': './src/lib/fields/rich-text/client.js',
			$lib: './src/lib',
			'@bienbien/rime': './src/lib'
		}
	}
};

export default config;
