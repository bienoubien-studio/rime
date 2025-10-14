import type { BuiltArea, BuiltCollection } from '$lib/core/config/types.js';
import type { Dic } from '$lib/util/types';
import type { IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';

export type WithIcons<T> = T & { icons: Dic<Component<IconProps>> };

export const augmentIcons = <
	const T extends { collections?: BuiltCollection[]; areas?: BuiltArea[] }
>(
	config: T
): WithIcons<T> => {
	const icons: Dic<Component<IconProps>> = {};

	// Add icons
	for (const collection of config.collections || []) {
		icons[collection.slug] = collection.icon;
	}
	for (const area of config.areas || []) {
		icons[area.slug] = area.icon;
	}

	return { ...config, icons } as const;
};
