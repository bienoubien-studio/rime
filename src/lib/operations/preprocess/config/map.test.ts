import { describe, expect, it } from 'vitest';
import { buildConfigMap } from './map';
import type { AnyField } from 'rizom/types/fields';

const data = {
	title2: 'Titrle2',
	Footabone: 'bone',
	tabone: 'tabone',
	tabonetext2: 'text',
	FootabtwoBlocks: [
		{
			id: '76b8cd88-885c-4634-9b11-e01b2781be54',
			text: null,
			locale: 'en',
			parentId: 'nf15b4o0vzzf59g9',
			type: 'paragraph',
			path: 'FootabtwoBlocks',
			position: 0
		},
		{
			image: [
				{
					id: null,
					relationTo: 'medias',
					path: 'FootabtwoBlocks.1.image',
					position: 0,
					relationId: 'poy38adgwrl629z5'
				}
			],
			id: '139f26b6-9ff5-4f8d-9630-791f29342184',
			type: 'images',
			path: 'FootabtwoBlocks',
			position: 1,
			legend: null,
			parentId: 'nf15b4o0vzzf59g9'
		}
	],
	components: [
		{
			image: [
				{
					id: null,
					relationTo: 'medias',
					path: 'components.0.image',
					position: 0,
					relationId: 'poy38adgwrl629z5'
				}
			],
			id: 'fe833772-117a-4299-b5a6-63f46ee22ff6',
			type: 'images',
			path: 'components',
			position: 0,
			legend: null,
			parentId: 'nf15b4o0vzzf59g9'
		},
		{
			subblocks: [
				{
					id: 'cd9fcf38-3e83-4e11-95b0-8d62599032e7',
					text: 'Foo',
					locale: 'en',
					parentId: 'nf15b4o0vzzf59g9',
					type: 'paragraph',
					path: 'components.1.subblocks',
					position: 0
				},
				{
					type: 'paragraph',
					path: 'components.1.subblocks',
					position: 1,
					text: 'Para',
					id: 'temp-fl3jpcko'
				}
			],
			id: 'ab99949a-1448-4255-b9ef-98a4b90019c0',
			type: 'slider',
			path: 'components',
			position: 1,
			image: null,
			parentId: 'nf15b4o0vzzf59g9'
		},
		{
			type: 'images',
			path: 'components',
			position: 2,
			image: [
				{
					id: null,
					relationTo: 'medias',
					path: 'components.2.image',
					position: 0,
					relationId: 'fr17wudkndqey3ki'
				}
			],
			legend: null,
			id: 'temp-5omqyuj8'
		}
	],
	image: [
		{
			id: '5f8e61a0-8a62-4b75-bb99-b6314e06b38b',
			relationTo: 'medias',
			path: 'image',
			position: 0,
			relationId: 'poy38adgwrl629z5',
			locale: 'en'
		},
		{
			id: 'bbf013f9-ed48-49a8-9500-c3e743021585',
			relationTo: 'medias',
			path: 'image',
			position: 1,
			relationId: 'fr17wudkndqey3ki',
			locale: 'en'
		},
		{
			id: '5f8e61a0-8a62-4b75-bb99-b6314e06b38b',
			relationTo: 'medias',
			path: 'image',
			position: 2,
			relationId: 'poy38adgwrl629z5',
			locale: 'en'
		},
		{
			id: 'bbf013f9-ed48-49a8-9500-c3e743021585',
			relationTo: 'medias',
			path: 'image',
			position: 3,
			relationId: 'fr17wudkndqey3ki',
			locale: 'en'
		},
		{
			id: '5f8e61a0-8a62-4b75-bb99-b6314e06b38b',
			relationTo: 'medias',
			path: 'image',
			position: 4,
			relationId: 'poy38adgwrl629z5',
			locale: 'en'
		}
	],
	otherPage: [
		{
			id: '6179f778-702c-45c9-bf27-d7cef9902f72',
			relationTo: 'pages',
			path: 'otherPage',
			position: 0,
			relationId: 'w3e5qpyrox0bx6jh'
		},
		{
			id: null,
			relationTo: 'pages',
			path: 'otherPage',
			position: 1,
			relationId: 'kcmb65t37l1ed88x'
		}
	],
	tabtwoBlocks: [
		{
			type: 'images',
			path: 'tabtwoBlocks',
			position: 0,
			image: [
				{
					id: null,
					relationTo: 'medias',
					path: 'tabtwoBlocks.0.image',
					position: 0,
					relationId: 'p1ozvfhaex2vr4yi'
				}
			],
			legend: null,
			id: 'temp-l37aup7r'
		}
	],
	related: [
		{
			id: null,
			relationTo: 'pages',
			path: 'related',
			position: 0,
			relationId: 'w3e5qpyrox0bx6jh'
		},
		{
			id: null,
			relationTo: 'pages',
			path: 'related',
			position: 1,
			relationId: 'cf1cacb7-fab3-49cd-badd-1280ea903a8a'
		}
	],
	author: [
		{
			id: null,
			relationTo: 'users',
			path: 'author',
			position: 0,
			relationId: '8e8328cd-717a-4148-b59e-5de4cf23f5cc'
		}
	]
};

const fields: AnyField[] = [
	{
		type: 'tabs',
		tabs: [
			{
				label: 'Layout',
				fields: [
					{
						type: 'blocks',
						name: 'components',
						blocks: [
							{
								name: 'paragraph',
								fields: [
									{ name: 'type', type: 'text', hidden: true },
									{ name: 'path', type: 'text', hidden: true },
									{ name: 'position', type: 'number', hidden: true },
									{ type: 'text', name: 'text', localized: true }
								],
								icon: await import('lucide-svelte/icons/text').then((module) => module.default),
								description: 'Simple paragraph'
							},
							{
								name: 'slider',
								fields: [
									{ name: 'type', type: 'text', hidden: true },
									{ name: 'path', type: 'text', hidden: true },
									{ name: 'position', type: 'number', hidden: true },
									{ type: 'text', name: 'image' },
									{
										type: 'blocks',
										name: 'subblocks',
										blocks: [
											{
												name: 'paragraph',
												fields: [
													{ name: 'type', type: 'text', hidden: true },
													{ name: 'path', type: 'text', hidden: true },
													{ name: 'position', type: 'number', hidden: true },
													{ type: 'text', name: 'text', localized: true }
												],
												icon: await import('lucide-svelte/icons/text').then(
													(module) => module.default
												),
												description: 'Simple paragraph'
											}
										]
									}
								],
								icon: await import('lucide-svelte/icons/images').then((module) => module.default),
								description: 'Simple slider'
							},
							{
								name: 'images',
								fields: [
									{ name: 'type', type: 'text', hidden: true },
									{ name: 'path', type: 'text', hidden: true },
									{ name: 'position', type: 'number', hidden: true },
									{ type: 'relation', name: 'image', relationTo: 'medias' },
									{ type: 'text', name: 'legend' }
								]
							}
						],
						table: { position: 99 }
					}
				]
			},
			{
				label: 'Attributes',
				fields: [
					{ type: 'text', name: 'title', localized: true, required: true },
					{
						type: 'slug',
						name: 'slug',
						slugify: 'title',
						table: { position: 2, sort: true },
						localized: true,
						required: true
					},
					{
						type: 'richText',
						name: 'intro',
						marks: ['bold', 'italic', 'strike', 'underline'],
						nodes: ['p', 'h2', 'h3']
					},
					{
						type: 'group',
						label: 'Foo',
						fields: [
							{ type: 'text', name: 'title2' },
							{
								type: 'relation',
								name: 'otherPage',
								relationTo: 'pages',
								many: true
							},
							{
								type: 'tabs',
								tabs: [
									{
										label: 'One',
										fields: [
											{ type: 'text', name: 'Footabone' },
											{ type: 'text', name: 'Footabonetext2' }
										]
									},
									{
										label: 'Two',
										fields: [
											{
												type: 'blocks',
												name: 'FootabtwoBlocks',
												blocks: [
													{
														name: 'images',
														fields: [
															{ name: 'type', type: 'text', hidden: true },
															{ name: 'path', type: 'text', hidden: true },
															{ name: 'position', type: 'number', hidden: true },
															{
																type: 'relation',
																name: 'image',
																relationTo: 'medias'
															},
															{ type: 'text', name: 'legend' }
														]
													},
													{
														name: 'paragraph',
														fields: [
															{ name: 'type', type: 'text', hidden: true },
															{ name: 'path', type: 'text', hidden: true },
															{ name: 'position', type: 'number', hidden: true },
															{ type: 'text', name: 'text', localized: true }
														],
														icon: await import('lucide-svelte/icons/text').then(
															(module) => module.default
														),
														description: 'Simple paragraph'
													}
												]
											}
										]
									}
								]
							}
						]
					},
					{
						type: 'tabs',
						tabs: [
							{
								label: 'One',
								fields: [
									{ type: 'text', name: 'tabone' },
									{ type: 'text', name: 'tabonetext2' }
								]
							},
							{
								label: 'Two',
								fields: [
									{
										type: 'blocks',
										name: 'tabtwoBlocks',
										blocks: [
											{
												name: 'images',
												fields: [
													{ name: 'type', type: 'text', hidden: true },
													{ name: 'path', type: 'text', hidden: true },
													{ name: 'position', type: 'number', hidden: true },
													{ type: 'relation', name: 'image', relationTo: 'medias' },
													{ type: 'text', name: 'legend' }
												]
											},
											{
												name: 'paragraph',
												fields: [
													{ name: 'type', type: 'text', hidden: true },
													{ name: 'path', type: 'text', hidden: true },
													{ name: 'position', type: 'number', hidden: true },
													{ type: 'text', name: 'text', localized: true }
												],
												icon: await import('lucide-svelte/icons/text').then(
													(module) => module.default
												),
												description: 'Simple paragraph'
											}
										]
									}
								]
							}
						]
					},
					{
						type: 'relation',
						name: 'image',
						relationTo: 'medias',
						many: true,
						localized: true
					},
					{ type: 'relation', name: 'related', relationTo: 'pages', many: true },
					{ type: 'relation', name: 'author', relationTo: 'users' }
				]
			},
			{
				label: 'Seo',
				fields: [
					{ type: 'text', name: 'metaTitle', localized: true },
					{ type: 'text', name: 'metaDescription', localized: true }
				]
			}
		]
	},
	{ name: 'createdAt', type: 'date', hidden: true },
	{ name: 'updatedAt', type: 'date', hidden: true }
];

describe('Test dataPathConfigMap', () => {
	const result = buildConfigMap(data, fields);
	it('pass 2', () => {
		expect(result.author.type).toBe('relation');
		expect(result['components.2.image'].type).toBe('relation');
		expect(result['components.2.legend'].type).toBe('text');
		expect(result['components.1.subblocks.1.text'].type).toBe('text');
	});
});
