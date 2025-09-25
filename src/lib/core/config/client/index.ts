import * as Area from '$lib/core/areas/config/builder.js';
import * as Collection from '$lib/core/collections/config/builder.js';
import { cacheClient } from '$lib/core/plugins/cache/index.js';
import type { Dic } from '$lib/util/types.js';
import { Book, BookCopy, BookType, SlidersVertical, type IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';
import { getStaffCollection } from '../shared/get-staff-collection.js';
import { registerPluginsClient } from '../shared/register-plugins.js';
import type { BuiltConfigClient, SanitizedConfigClient } from '../types.js';

const buildConfigClient = (config: SanitizedConfigClient): BuiltConfigClient => {
	const icons: Dic<Component<IconProps>> = {};

	const staff = Collection.config('staff', getStaffCollection(config.staff));

	// Add icons
	for (const collection of [staff, ...config.collections]) {
		icons[collection.slug] = collection.icon;
	}
	for (const area of config.areas) {
		icons[area.slug] = area.icon;
	}

	const panelNavigationGroups = [
		...(config.panel?.navigation?.groups || []),
		{ label: 'content', icon: BookType },
		{ label: 'system', icon: SlidersVertical },
		{ label: 'collections', icon: BookCopy },
		{ label: 'areas', icon: Book }
	];

	const baseBuiltConfig = {
		siteUrl: config.siteUrl,
		collections: [staff, ...config.collections],
		areas: config.areas,
		localization: config.localization ? config.localization : undefined,
		panel: {
			routes: config.panel?.routes ? config.panel.routes : {},
			language: config.panel?.language || 'en',
			navigation: { groups: panelNavigationGroups },
			components: {
				header: config.panel?.components?.header || [],
				...(config.panel?.components?.dashboard && { dashboard: config.panel.components.dashboard })
			}
		},
		icons
	};

	const builtConfig = registerPluginsClient({
		plugins: [cacheClient(), ...(config.plugins || [])],
		builtConfig: baseBuiltConfig
	});

	return builtConfig;
};

export { Area, buildConfigClient, Collection };
