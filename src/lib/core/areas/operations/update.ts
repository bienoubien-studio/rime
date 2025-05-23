import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { LocalAPI } from '$lib/core/operations/local-api.server.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { AreaSlug } from '$lib/types.js';
import { populateURL } from '$lib/core/operations/shared/populateURL.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import { validateFields } from '$lib/core/operations/shared/validateFields.server.js';
import { buildConfigMap } from '../../operations/configMap/index.server.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { DeepPartial } from '$lib/util/types.js';
import type { RegisterArea } from '$lib/index.js';

type UpdateArgs<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
	versionId?: string;
};

export const update = async <T extends GenericDoc = GenericDoc>(args: UpdateArgs<T>) => {
	//
	const { config, event, adapter, locale, api, versionId } = args;
	let data = args.data;

	const authorized = config.access.update(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const original = (await api.area(config.slug).find({ locale, versionId })) as unknown as T;
	const originalConfigMap = buildConfigMap(original, config.fields);
	const configMap = buildConfigMap(data, config.fields);

	data = await validateFields({
		data,
		event,
		locale,
		config,
		configMap,
		original,
		operation: 'update',
	});
	
	for (const hook of config.hooks?.beforeUpdate || []) {
		/**
		 * TS is expecting a more specific types, 
		 * but with RegisterArea[AreaSlug] devs get their 
		 * types in the hook definition arguments
		 */
		const result = await hook({
			data: data as DeepPartial<RegisterArea[AreaSlug]>,
			config,
			originalDoc: original as unknown as RegisterArea[AreaSlug],
			operation: 'update',
			api,
			rizom: event.locals.rizom,
			event
		});
		data = result.data as Partial<T>;
	}

	const incomingPaths = Object.keys(configMap);

	const updateResult = await adapter.area.update({
		slug: config.slug,
		data,
		locale,
		versionId
	});

	
	// Use the versionId from the update result for blocks, trees, and relations
	const blocksDiff = await saveBlocks({
		ownerId: updateResult.versionId,
		configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: updateResult.versionId,
		configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: updateResult.versionId,
		configMap,
		data,
		incomingPaths,
		adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	
	// Get the updated area with the correct version ID
	let document = await api.area(config.slug).find({ locale, versionId: updateResult.versionId });
	
	// Populate URL
	document = await populateURL(document, { config, event, locale })

	// Handle localized URLs if needed
	const locales = event.locals.rizom.config.getLocalesCodes();
	if (locales.length) {
		for(const otherLocale of locales){
			if (otherLocale !== locale) {
				const documentLocale = await api.area(config.slug).find({ locale: otherLocale, versionId: updateResult.versionId });
				await populateURL(documentLocale, { config, event, locale: otherLocale })
			}
		}
	}

	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			config,
			operation: 'update',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	
	return document as unknown as T;
};
