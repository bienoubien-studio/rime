import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			'rime/panel/auth/client': './src/lib/panel/pages/auth/index.js',
			'rime/panel/auth': './src/lib/panel/pages/auth/index.server.js',
			'rime/panel/client': './src/lib/panel/index.js',
			'rime/i18n': './src/lib/core/i18n',
			'rime/api': './src/lib/core/api/index.server.js',
			'rime/config/server': './src/lib/core/config/server/index.server.js',
			'rime/config/client': './src/lib/core/config/client/index.js',
			'rime/fields/richText': './src/lib/fields/rich-text/client.js',
			$lib: './src/lib',
			rime: './src/lib'
		}
	}
};

export default config;
