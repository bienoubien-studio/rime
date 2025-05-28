import {
	relation,
	richText,
	text,
	toggle,
	slug,
	tabs,
	tab,
	date
} from '$lib/fields/index.js';
import { access } from '$lib/util/access/index.js';
import { Images, Settings2, NotebookText } from '@lucide/svelte';
import { collection, area, defineConfig } from '$lib/index.js';
import { apiInit } from './api-init/index.js';

const Settings = area('settings', {
	icon: Settings2,
	group: 'system',
	description: "System settings, maintenance and more",
	fields: [toggle('maintenance').label('Maintenance').required(), relation('logo').to('medias')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	},
	versions: { draft: true }
});

const Infos = area('infos', {
	icon: Settings2,
	group: 'system',
	description: "System settings, maintenance and more",
	fields: [text('title')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	},
	versions: true
});

const tabWriter = tab('writer').fields(
	richText('text').features('bold', 'italic', 'media:medias?where[mimeType][like]=image', 'heading:2,3', 'link')
)

const tabNewsAttributes = tab('attributes').fields(
	text('title').isTitle().localized().required(),
	slug('slug')
		.slugify('attributes.title')
		.live(false)
		.table({ position: 3, sort: true })
		.localized()
		.required(),
	richText('intro').features('bold', 'link'),
	date('published')
);

const News = collection('news', {
	icon: NotebookText,
	group: 'content',
	description: "Create article for your readers",
	fields: [tabs(tabNewsAttributes, tabWriter)],
	live: true,
	url: (doc) => `${process.env.PUBLIC_RIZOM_URL}/actualites/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	versions: { draft: true }
})

const Medias = collection('medias', {
	label: { singular: 'Media', plural: 'Medias', gender: 'm' },
	description: "Manage images, video, audio, documents,...",
	upload: true,
	icon: Images,
	group: 'content',
	imageSizes: [
		{ name: 'sm', width: 640, out: ['webp'] },
		{ name: 'md', width: 1024, out: ['webp'] },
		{ name: 'lg', width: 1536, out: ['webp'] },
		{ name: 'xl', width: 2048, out: ['webp'] }
	],
	fields: [text('alt').required()],
	access: {
		read: () => true
	},
	versions: true
});

export default defineConfig({
	database: 'versions.sqlite',
	collections: [News, Medias],
	areas: [Settings, Infos],
	plugins: [apiInit()],
	panel: {
		users: {
			roles: [{ value: 'editor' }]
		}
	}
});
