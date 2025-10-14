import {
	block,
	blocks,
	component,
	date,
	email,
	group,
	link,
	relation,
	richText,
	select,
	separator,
	slug,
	tab,
	tabs,
	text,
	textarea,
	toggle,
	tree
} from '$lib/fields/index.js';
import { access } from '$lib/util/access/index.js';
import {
	AppWindowMac,
	BookType,
	Contact,
	Images,
	Menu,
	Newspaper,
	NotebookText,
	Settings2,
	SlidersVertical
} from '@lucide/svelte';

import { adapterSqlite } from '$lib/adapter-sqlite/index.server';
import {
	bold,
	heading,
	italic,
	link as linkFeature,
	resource,
	upload
} from '$lib/fields/rich-text/client.js';
import { Area, Collection, Hooks, rime } from '$rime/config';
import URL from './components/URL.svelte';
import LoremFeature from './lorem-fill.js';

const tabSEO = tab('metas')
	.label('SEO')
	.fields(
		text('title').label('Meta title').layout('compact'),
		textarea('description').label('Meta description')
	)
	.live(false);

const tabAttributes = tab('attributes')
	.label('Attributes')
	.fields(
		text('title').isTitle().required().layout('compact'),
		component(URL),
		toggle('isHome').label('Homepage').live(false).table(2),
		slug('slug')
			.slugify('attributes.title')
			.condition((_, siblings) => siblings.isHome !== true)
			.live(false),
		separator(),
		group('summary').fields(relation('thumbnail').to('medias'), richText('intro')),
		separator(),
		select('template')
			.options('basic', 'large')
			.access({
				create: (user) => access.isAdmin(user),
				update: (user) => access.isAdmin(user),
				read: () => true
			})
	);

const blockKeyFacts = block('keyFacts').fields(
	tree('facts')
		.fields(
			//
			text('title'),
			richText('description'),
			select('icon').options('one', 'two'),
			relation('image').to('medias')
		)
		.renderTitle(({ values }) => values.title)
);

const blockParagraph = block('paragraph').fields(richText('text'));
const blockImage = block('image').fields(
	relation('image').to('medias').query(`where[mimeType][like]=image`)
);
const blockSlider = block('slider').fields(relation('images').to('medias').many());
const blockSubContent = block('content').fields(text('title'), richText('text'));
const blockBlack = block('black').fields(
	text('title'),
	blocks('text', [blockParagraph, blockImage, blockSlider, blockSubContent])
);
const tabLayout = tab('layout')
	.label('Layout')
	.fields(
		group('hero').fields(text('title').isTitle(), text('intro'), relation('image').to('medias')),
		separator(),
		blocks('sections', [blockParagraph, blockImage, blockSlider, blockKeyFacts, blockBlack])
	);

const clearCacheHook = Hooks.afterUpsert<'pages'>(async (args) => {
	args.event.locals.rime.cache.clear();
	return args;
});

const setHome = Hooks.beforeUpsert<'pages'>(async (args) => {
	const { data, event } = args;

	if (data?.attributes?.isHome) {
		const query = `where[attributes.isHome][equals]=true`;

		const pagesIsHome = await event.locals.rime.collection('pages').find({ query });

		for (const page of pagesIsHome) {
			await event.locals.rime.collection('pages').updateById({
				id: page.id,
				data: { attributes: { isHome: false } }
			});
		}
	}

	return args;
});

const Pages = Collection.create('pages', {
	label: { singular: 'Page', plural: 'Pages' },
	panel: {
		group: 'content',
		description: 'Edit and create your website pages'
	},
	icon: Newspaper,
	fields: [tabs(tabAttributes, tabLayout, tabSEO)],
	live: true,
	nested: true,
	$url: (doc) =>
		doc.attributes.isHome
			? `${process.env.PUBLIC_RIME_URL}/`
			: `${process.env.PUBLIC_RIME_URL}/[...parent.attributes.slug]/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	$hooks: {
		afterUpdate: [clearCacheHook],
		afterCreate: [clearCacheHook],
		beforeCreate: [setHome],
		beforeUpdate: [setHome]
	}
});

const Link = [
	text('label').layout('compact'),
	link('link').types('pages', 'url').layout('compact')
];

const Navigation = Area.create('navigation', {
	icon: Menu,
	panel: {
		group: 'global',
		description: 'Define your website navigation'
	},
	fields: [
		//
		tabs(
			tab('header').fields(
				tree('mainNav')
					.fields(...Link)
					.renderTitle(({ values }) => values.label || 'Lien')
					.label('Menu principal')
					.addItemLabel('Ajouter un lien')
			),
			tab('footer').fields(tree('footerNav').fields(...Link))
		)
	],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	}
});

const Settings = Area.create('settings', {
	icon: Settings2,
	panel: {
		group: 'system',
		description: 'System settings, maintenance and more'
	},
	fields: [toggle('maintenance').label('Maintenance').required(), relation('logo').to('medias')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	}
});

const Informations = Area.create('infos', {
	icon: Contact,
	panel: {
		group: 'global',
		description: 'Update your website information, email, name of the website,...'
	},
	fields: [
		email('email'),
		slug('instagram').placeholder('nom-du-compte'),
		textarea('address').label('Adresse')
	],
	access: {
		read: () => true
	}
});

const tabWriter = tab('writer').fields(
	richText('text').features(
		bold(),
		italic(),
		LoremFeature,
		resource({ slug: 'pages' }),
		upload({ slug: 'medias', query: 'where[mimeType][like]=image' }),
		heading(2, 3),
		linkFeature()
	)
);

const tabNewsAttributes = tab('attributes').fields(
	text('title').isTitle().localized().required(),
	slug('slug')
		.slugify('attributes.title')
		.live(false)
		.table({ position: 3, sort: true })
		.localized()
		.required(),
	richText('intro').features(bold(), linkFeature()),
	date('published')
);

const News = Collection.create('news', {
	icon: NotebookText,
	panel: {
		description: 'Create article for your readers',
		group: 'content'
	},
	fields: [tabs(tabNewsAttributes, tabWriter)],
	live: true,
	$url: (doc) => `${process.env.PUBLIC_RIME_URL}/actualites/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	}
});

const Medias = Collection.create('medias', {
	label: { singular: 'Media', plural: 'Medias' },
	panel: {
		description: 'Manage images, video, audio, documents,...',
		group: 'content'
	},
	upload: {
		imageSizes: [
			{ name: 'sm', width: 640, out: ['webp'] },
			{ name: 'md', width: 1024, out: ['webp'] },
			{ name: 'lg', width: 1536, out: ['webp'] },
			{ name: 'xl', width: 2048, out: ['webp'] }
		]
	},
	icon: Images,
	fields: [text('alt').required()],
	access: {
		read: () => true
	}
});

const Users = Collection.create('users', {
	auth: {
		type: 'password',
		roles: ['user']
	},
	fields: [text('website')],
	access: {
		create: () => true,
		read: () => true,
		update: (user, { id }) => access.isAdminOrMe(user, id),
		delete: (user, { id }) => access.isAdminOrMe(user, id)
	}
});

const Apps = Collection.create('apps', {
	auth: {
		type: 'apiKey',
		roles: ['apps']
	},
	fields: [],
	access: {
		create: (user) => access.isAdmin(user),
		read: (user) => access.isAdmin(user),
		update: (user) => access.isAdmin(user),
		delete: (user) => access.isAdmin(user)
	}
});

export default rime({
	$adapter: adapterSqlite('basic.sqlite'),
	collections: [Pages, Medias, News, Users, Apps],
	areas: [Settings, Navigation, Informations],
	$smtp: {
		from: process.env.RIME_SMTP_USER,
		host: process.env.RIME_SMTP_HOST,
		port: parseInt(process.env.RIME_SMTP_PORT || '465'),
		auth: {
			user: process.env.RIME_SMTP_USER,
			password: process.env.RIME_SMTP_PASSWORD
		}
	},
	staff: {
		roles: [{ value: 'editor' }]
	},
	panel: {
		navigation: {
			groups: [
				{ label: 'content', icon: BookType },
				{ label: 'global', icon: AppWindowMac },
				{ label: 'system', icon: SlidersVertical }
			]
		}
	}
});
