import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea } from '$lib/core/config/types/index.js';
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
import { setValuesFromOriginal } from '$lib/core/operations/shared/setValuesFromOriginal.js';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues.js';
import { getVersionUpdateOperation, VersionOperations } from '$lib/core/operations/shared/versions.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';

type UpdateArgs<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	versionId?: string;
	draft?: boolean;
};

export const update = async <T extends GenericDoc = GenericDoc>(args: UpdateArgs<T>) => {
	//
	const { config, event, locale } = args;
	const { rizom } = event.locals
	let data = args.data;
	let versionId = args.versionId
	
	// Check authorization
	const authorized = config.access.update(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Define the kind of update operation depending on versions config
	const versionOperation = getVersionUpdateOperation({ draft: args.draft, versionId, config })
	
	// Allow draft version to be retrieved in specific scenarios
	// In all other cases the "published" document is used
	const original = (await rizom.area(config.slug).find({
		locale,
		versionId,
		draft: VersionOperations.shouldRetrieveDraft(versionOperation)
	})) as unknown as T;
	
	// set the versionId from the original to update the proper version if none provided
	if (config.versions && !versionId) {
		versionId = original.versionId
	}
	
	const originalConfigMap = buildConfigMap(original, config.fields);

	// For new versions creation scenario, add data from the original doc
	// This ensures required field values will be present when creating the new version
	if (config.versions && VersionOperations.isNewVersionCreation(versionOperation)) {
		data = await setValuesFromOriginal({ data, original, configMap: originalConfigMap })
		if (config.versions.draft && !data.status) {
			//@ts-ignore will fix this
			data.status = VERSIONS_STATUS.DRAFT
		}
	}
	
	// build the config map according to the augmented data
	const configMap = buildConfigMap(data, config.fields);

	// For versions creation set default values for all empty fields
	// in all other cases set only for required and empties
	data = await setDefaultValues({
		data,
		adapter: rizom.adapter,
		configMap,
		mode: VersionOperations.isNewVersionCreation(versionOperation) ? "always" : "required"
	});

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
			rizom,
			event
		});
		data = result.data as Partial<T>;
	}

	const incomingPaths = Object.keys(configMap);

	const updateResult = await rizom.adapter.area.update({
		slug: config.slug,
		data,
		locale,
		versionId,
		versionOperation
	});

	// Use the versionId from the update result for blocks, trees, and relations
	const blocksDiff = await saveBlocks({
		ownerId: updateResult.versionId,
		configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter: rizom.adapter,
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
		adapter: rizom.adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: updateResult.versionId,
		configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});


	// Get the updated area with the correct version ID
	let document = await rizom.area(config.slug).find({ 
		locale, 
		versionId: updateResult.versionId, 
		draft: true
	});

	// Populate URL
	document = await populateURL(document, { config, event, locale })

	// Handle localized URLs if needed
	const locales = event.locals.rizom.config.getLocalesCodes();
	if (locales.length) {
		for (const otherLocale of locales) {
			if (otherLocale !== locale) {
				const documentLocale = await rizom.area(config.slug).find({ locale: otherLocale, versionId: updateResult.versionId, draft: true });
				await populateURL(documentLocale, { config, event, locale: otherLocale })
			}
		}
	}

	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			config,
			operation: 'update',
			rizom: event.locals.rizom,
			event
		});
	}


	return document as unknown as T;
};
