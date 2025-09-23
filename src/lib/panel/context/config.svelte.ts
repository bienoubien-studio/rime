import type { BuiltArea, BuiltCollection, BuiltConfigClient } from '$lib/core/config/types';
import type { Prototype, PrototypeSlug } from '$lib/core/types/doc';
import { getContext, setContext } from 'svelte';

function createConfigStore(config: BuiltConfigClient) {
	function getArea(slug: string): BuiltArea {
		return config.areas.filter((c) => c.slug === slug)[0];
	}

	function getCollection(slug: string): BuiltCollection {
		return config.collections.filter((c) => c.slug === slug)[0];
	}

	function getDocumentConfig({ prototype, slug }: GetDocumentConfigArgs) {
		return prototype === 'area' ? getArea(slug) : getCollection(slug);
	}

	return {
		get raw() {
			return config;
		},
		getArea,
		getCollection,
		getDocumentConfig
	};
}

const CONFIG_KEY = Symbol('rizom.config');

export function setConfigContext(initial: BuiltConfigClient) {
	const store = createConfigStore(initial);
	return setContext(CONFIG_KEY, store);
}

export function getConfigContext() {
	return getContext<ReturnType<typeof setConfigContext>>(CONFIG_KEY);
}

type GetDocumentConfigArgs = {
	prototype: Prototype;
	slug: PrototypeSlug;
};
