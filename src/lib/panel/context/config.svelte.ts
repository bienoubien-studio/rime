import type { CompiledCollection, BrowserConfig, CompiledArea } from 'rizom/types/config';
import type { DocPrototype, PrototypeSlug } from 'rizom/types/doc';
import { getContext, setContext } from 'svelte';

function createConfigStore(config: BrowserConfig) {
	function getArea(slug: string): CompiledArea {
		return config.areas.filter((c) => c.slug === slug)[0];
	}

	function getCollection(slug: string): CompiledCollection {
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

export function setConfigContext(initial: BrowserConfig) {
	const store = createConfigStore(initial);
	return setContext(CONFIG_KEY, store);
}

export function getConfigContext() {
	return getContext<ReturnType<typeof setConfigContext>>(CONFIG_KEY);
}

type GetDocumentConfigArgs = {
	prototype: DocPrototype;
	slug: PrototypeSlug;
};
