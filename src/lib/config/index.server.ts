import path from 'path';
import { RizomError } from '../errors/index.js';
import { flattenWithGuard } from '../util/object.js';
import { buildConfig } from './build/index.js';
import { existsSync, mkdirSync } from 'fs';
import type { CompiledCollection, CompiledArea, CompiledConfig } from 'rizom/types/config.js';
import type { AsyncReturnType, Dic } from 'rizom/types/util.js';
import type { CollectionSlug, Config, Field, FormField, PrototypeSlug } from 'rizom/types/index.js';
import type { AreaSlug } from 'rizom/types/doc.js';
import { isBlocksFieldRaw, isFormField, isTabsFieldRaw } from 'rizom/util/field.js';

const dev = process.env.NODE_ENV === 'development';

export async function createConfigInterface(rawConfig: Config) {
	const config: CompiledConfig = await buildConfig(rawConfig, { generateFiles: dev });

	const flattenConfig = (config: CompiledConfig) => {
		return flattenWithGuard(config, {
			shouldFlat: ([key]) =>
				!['cors', 'plugins', 'routes', 'locales', 'areas', 'collections'].includes(key)
		});
	};

	const flatConfig: Dic = flattenConfig(config);

	// Initialize required upload folder
	const hasUpload = config.collections.some((collection) => !!collection.upload);
	if (hasUpload) {
		const staticDirectory = path.resolve(process.cwd(), 'static');
		if (!existsSync(staticDirectory)) {
			mkdirSync(staticDirectory);
		}
		const mediasDirectory = path.resolve(staticDirectory, 'medias');
		if (!existsSync(mediasDirectory)) {
			mkdirSync(mediasDirectory);
		}
	}

	const getArea = (slug: string): CompiledArea | undefined => {
		return config.areas.find((g) => g.slug === slug);
	};

	const getCollection = (slug: string): CompiledCollection | undefined => {
		return config.collections.find((c) => c.slug === slug);
	};

	const getBySlug = (slug: string) => {
		return getArea(slug) || getCollection(slug);
	};

	const isCollection = (slug: string): slug is CollectionSlug => {
		return !!getCollection(slug);
	};

	const isArea = (slug: string): slug is AreaSlug => {
		return !!getArea(slug);
	};

	const getDocumentPrototype = (slug: PrototypeSlug) => {
		if (isCollection(slug)) {
			return 'collection';
		} else if (isArea(slug)) {
			return 'area';
		}
		throw new RizomError(slug + 'is neither a collection nor a globlal');
	};

	const getFieldByPath = (path: string, fields: Field[]) => {
		const parts = path.split('.');

		const findInFields = (currentFields: Field[], remainingParts: string[]): FormField | null => {
			if (remainingParts.length === 0) return null;

			const currentPart = remainingParts[0];

			for (const field of currentFields) {
				// Handle tabs
				if (isTabsFieldRaw(field)) {
					const tab = field.tabs.find((t) => t.name === currentPart);
					if (tab) {
						return findInFields(tab.fields, remainingParts.slice(1));
					}
					continue;
				}

				// Handle regular fields
				if (isFormField(field)) {
					if (field.name === currentPart) {
						if (remainingParts.length === 1) {
							return field;
						}

						// Handle blocks
						if (isBlocksFieldRaw(field)) {
							const blockType = remainingParts[1];
							const block = field.blocks.find((b) => b.name === blockType);
							if (block) {
								return findInFields(block.fields, remainingParts.slice(2));
							}
						}
					}
				}
			}

			return null;
		};

		return findInFields(fields, parts);
	};

	return {
		//
		get raw() {
			if (!config) {
				throw new RizomError('config not loaded yet');
			}
			return config;
		},

		get(path?: string) {
			if (!config) {
				throw new RizomError('config not loaded yet');
			}
			if (!path) return config;

			return path in flatConfig ? flatConfig[path] : null;
		},

		get collections() {
			return config.collections;
		},

		get areas() {
			return config.areas;
		},

		getDefaultLocale() {
			return config.localization?.default || undefined;
		},

		getLocalesCodes() {
			return config.localization ? config.localization.locales.map((locale) => locale.code) : [];
		},

		isValidLocale(locale: any) {
			const locales = config.localization
				? config.localization.locales.map((locale) => locale.code)
				: [];
			return locales.includes(locale);
		},

		getFieldByPath,
		getDocumentPrototype,
		getArea,
		getCollection,
		isCollection,
		isArea,
		getBySlug
	};
}

export type ConfigInterface = AsyncReturnType<typeof createConfigInterface>;
