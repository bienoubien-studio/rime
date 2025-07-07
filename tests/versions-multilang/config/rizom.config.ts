import { relation, richText, text, toggle, slug, tabs, tab, date, group } from '$lib/fields/index.js';
import { access } from '$lib/util/access/index.js';
import { collection, area, defineConfig } from '$lib/index.js';

const Settings = area('settings', {
	fields: [text('title'), toggle('maintenance').label('Maintenance').required(), relation('logo').to('medias')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	},
	versions: { draft: true }
});

const Infos = area('infos', {
	fields: [text('title').localized(), text('email').localized()],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	},
	versions: true
});

const tabWriter = tab('writer').fields(
	richText('text').features('bold', 'italic', 'media:medias?where[mimeType][like]=image', 'heading:2,3', 'link')
);

const tabNewsAttributes = tab('attributes').fields(
	text('title').isTitle().localized().required(),
	slug('slug').slugify('attributes.title').live(false).table({ position: 3, sort: true }).localized().required(),
	relation('image').to('medias'),
	richText('intro').features('bold', 'link'),
	date('published')
);

const News = collection('news', {
	fields: [tabs(tabNewsAttributes, tabWriter)],
	live: true,
	url: (doc) => `${process.env.PUBLIC_RIZOM_URL}/actualites/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	versions: { draft: true }
});

const Medias = collection('medias', {
	panel: {
		group: 'content'
	},
	upload: {
		imageSizes: [
			{ name: 'thumbnail', width: 400, out: ['webp'] },
			{ name: 'small', width: 720, out: ['webp'] },
			{ name: 'medium', width: 720, height: 1024, out: ['webp'] },
			{ name: 'large', width: 1080, out: ['webp'] }
		]
	},
	fields: [text('alt').localized().required()],
	access: {
		read: () => true
	},
	versions: true
});

const Pdf = collection('pdf', {
	upload: true,
	panel: {
		group: 'content'
	},
	fields: [text('alt').required()],
	access: {
		read: () => true
	},
	versions: { draft: true }
});

const Pages = collection('pages', {
	panel: {
		group: 'content'
	},
	fields: [
		//
		group('attributes').fields(
			//
			text('title').isTitle(),
			slug('slug'),
			toggle('isHome')
		)
	],
	url: (doc) => '/',
	nested: true,
	access: {
		read: () => true
	},
	versions: { draft: true }
});

export default defineConfig({
	database: 'versions-multilang.sqlite',
	collections: [News, Medias, Pdf, Pages],
	areas: [Settings, Infos],
	localization: {
		locales: [
			{ code: 'fr', label: 'Français' },
			{ code: 'en', label: 'English' },
			{ code: 'de', label: 'German' }
		],
		default: 'en'
	},
	panel: {
		users: {
			roles: [{ value: 'editor' }]
		}
	}
});
