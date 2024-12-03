import type { BuiltCollectionConfig, BrowserConfig, BuiltGlobalConfig } from 'rizom/types/config';
import type { DocPrototype, PrototypeSlug } from 'rizom/types/doc';
import { getContext, setContext } from 'svelte';

function createConfigStore(config: BrowserConfig) {
	function getGlobalConfig(slug: string): BuiltGlobalConfig {
		return config.globals.filter((c) => c.slug === slug)[0];
	}

	function getCollectionConfig(slug: string): BuiltCollectionConfig {
		return config.collections.filter((c) => c.slug === slug)[0];
	}

	function getDocumentConfig({ prototype, slug }: GetDocumentConfigArgs) {
		return prototype === 'global' ? getGlobalConfig(slug) : getCollectionConfig(slug);
	}

	return {
		get raw() {
			return config;
		},
		getGlobalConfig,
		getCollectionConfig,
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
