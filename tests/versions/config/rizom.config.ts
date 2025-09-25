import { date, group, relation, richText, slug, tab, tabs, text, toggle } from '$lib/fields/index.js';
import { access } from '$lib/util/access/index.js';
import { Area, buildConfig, Collection } from '$rizom/config';

const Settings = Area.config('settings', {
	fields: [text('title'), toggle('maintenance').label('Maintenance').required(), relation('logo').to('medias')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	},
	versions: { draft: true }
});

const Infos = Area.config('infos', {
	fields: [text('title'), text('email')],
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

const News = Collection.config('news', {
	fields: [tabs(tabNewsAttributes, tabWriter)],
	live: true,
	$url: (doc) => `${process.env.PUBLIC_RIZOM_URL}/actualites/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	versions: { draft: true }
});

const Medias = Collection.config('medias', {
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
	fields: [text('alt').required()],
	access: {
		read: () => true
	},
	versions: true
});

const Pdf = Collection.config('pdf', {
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

const Pages = Collection.config('pages', {
	panel: {
		group: 'content'
	},
	fields: [group('attributes').fields(text('title').isTitle(), slug('slug'), toggle('isHome'))],
	$url: () => '/',
	nested: true,
	access: {
		read: () => true
	},
	versions: { draft: true }
});

export default buildConfig({
	$database: 'versions.sqlite',
	collections: [News, Medias, Pdf, Pages],
	areas: [Settings, Infos],
	staff: {
		roles: [{ value: 'editor' }]
	}
});
