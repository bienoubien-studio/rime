import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/sqlite/index.server.js';
import type { CompiledArea } from '$lib/types/config.js';
import type { LocalAPI } from '$lib/operations/localAPI/index.server.js';
import type { GenericDoc } from '$lib/types/doc.js';
import type { AreaSlug } from '$lib/types/index.js';
import { populateURL } from '../tasks/populateURL.server.js';
import { RizomError } from '$lib/errors/index.js';
import { validateFields } from '../tasks/validateFields.server.js';
import { buildConfigMap } from '../tasks/configMap/index.server.js';
import { saveBlocks } from '../tasks/blocks/index.server.js';
import { saveTreeBlocks } from '../tasks/tree/index.server.js';
import { saveRelations } from '../tasks/relations/index.server.js';
import type { DeepPartial } from '$lib/types/util.js';
import type { RegisterArea } from 'rizom';

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
