import { defineConfig } from '$rizom/config';
import { AppWindowMac, BookType, SlidersVertical } from '@lucide/svelte';

// const clearCacheHook = Hooks.afterUpsert<'pages'>(async (args) => {
// 	args.event.locals.rizom.cache.clear();
// 	return args;
// });

// const Pages = collection('pages', {
// 	label: { singular: 'Page', plural: 'Pages', gender: 'f' },
// 	panel: {
// 		group: 'content',
// 		description: 'Edit and create your website pages'
// 	},
// 	icon: Newspaper,
// 	fields: [text('title')],
// 	live: true,
// 	nested: true,
// 	url: (doc) =>
// 		doc.attributes.isHome
// 			? `${process.env.PUBLIC_RIZOM_URL}/`
// 			: `${process.env.PUBLIC_RIZOM_URL}/[...parent.attributes.slug]/${doc.attributes.slug}`,
// 	access: {
// 		read: () => true,
// 		create: (user) => access.isAdmin(user),
// 		update: (user) => access.hasRoles(user, 'admin', 'editor')
// 	},
// 	hooks: {
// 		afterUpdate: [clearCacheHook],
// 		afterCreate: [clearCacheHook]
// 	}
// });

// const Informations = area('infos', {
// 	icon: Contact,
// 	panel: {
// 		group: 'global',
// 		description: 'Update your website information, email, name of the website,...'
// 	},
// 	fields: [text('email')],
// 	access: {
// 		read: () => true
// 	}
// });

// const tabWriter = tab('writer').fields(
// 	richText('text').features(
// 		'bold',
// 		'italic',
// 		LoremFeature,
// 		'resource:pages',
// 		'media:medias?where[mimeType][like]=image',
// 		'heading:2,3',
// 		'link'
// 	)
// );

// const Medias = collection('medias', {
// 	label: { singular: 'Media', plural: 'Medias', gender: 'm' },
// 	panel: {
// 		description: 'Manage images, video, audio, documents,...',
// 		group: 'content'
// 	},
// 	upload: {
// 		imageSizes: [
// 			{ name: 'sm', width: 640, out: ['webp'] },
// 			{ name: 'md', width: 1024, out: ['webp'] },
// 			{ name: 'lg', width: 1536, out: ['webp'] },
// 			{ name: 'xl', width: 2048, out: ['webp'] }
// 		]
// 	},
// 	icon: Images,
// 	fields: [text('alt').required()],
// 	access: {
// 		read: () => true
// 	}
// });

// const Users = collection('users', {
// 	auth: {
// 		type: 'password',
// 		roles: ['user']
// 	},
// 	fields: [text('website')],
// 	access: {
// 		create: () => true,
// 		read: () => true,
// 		update: (user, { id }) => access.isAdminOrMe(user, id),
// 		delete: (user, { id }) => access.isAdminOrMe(user, id)
// 	}
// });

export default defineConfig({
	database: 'basic.sqlite',
	collections: [],
	areas: [],
	// smtp: {
	// 	from: process.env.RIZOM_SMTP_USER,
	// 	host: process.env.RIZOM_SMTP_HOST,
	// 	port: parseInt(process.env.RIZOM_SMTP_PORT || '465'),
	// 	auth: {
	// 		user: process.env.RIZOM_SMTP_USER,
	// 		password: process.env.RIZOM_SMTP_PASSWORD
	// 	}
	// },
	panel: {
		users: {
			roles: [{ value: 'editor' }]
		},
		navigation: {
			groups: [
				{ label: 'content', icon: BookType },
				{ label: 'global', icon: AppWindowMac },
				{ label: 'system', icon: SlidersVertical }
			]
		}
	}
});
