/** auto-generated */
import { buildConfig } from '$rizom/core';
import pages from './pages.server.js';

export default buildConfig({
	database: 'basic.sqlite',
	localization: {
		locales: [
			{ code: 'fr', label: 'Français' },
			{ code: 'en', label: 'English' },
			{ code: 'de', label: 'German' }
		],
		default: 'en'
	},
	collections: [pages],
	areas: []
});
