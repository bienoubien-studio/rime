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
import { getVersionUpdateOperation, VERSIONS_OPERATIONS } from '$lib/core/operations/shared/get-versions-operation.js';

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

	const versionOperation = getVersionUpdateOperation({ draft: args.draft, versionId, config })

	// Version OUTCOMES : 
	// a - update_latest
	// b - update_published
	// c - create_draft_from_published
	// d - create_version_from_latest

	// scenario 1 : no versions

	// scenario 2 : versions but no draft
	// a. if versionId update the versionId
	// b. if no versionId create a new version

	// scenario 3 : versions with drafts
	// a. if versionId update the versionId
	// b. if no versionId and draft is falsy update the published
	// c. if no versionId and draft is true create a new draft from the published version

	const authorized = config.access.update(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Allow draft version to retrieve the latest
	const original = (await rizom.area(config.slug).find({
		locale,
		versionId,
		draft: [ VERSIONS_OPERATIONS.NEW_VERSION_FROM_LATEST, VERSIONS_OPERATIONS.UPDATE_VERSION ].includes(versionOperation)
	})) as unknown as T;

	// // 3.b, 3.c, 2.b : when no versionId provided, get either : 
	// // - the latest if draft is true
	// // - the published if draft is false
	// // set the versionId from the original to update the proper version
	if (config.versions && !versionId) {
		versionId = original.versionId
	}
	
	const originalConfigMap = buildConfigMap(original, config.fields);

	// For scenario 2.b and 3.c a new version is created
	// So add fields from the original doc in data, that way required field values will be present
	// when creating the new version
	if (config.versions && [ VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED, VERSIONS_OPERATIONS.NEW_VERSION_FROM_LATEST ].includes(versionOperation)) {
		data = await setValuesFromOriginal({ data, original, configMap: originalConfigMap })
		if (config.versions.draft && !data.status) {
			//@ts-ignore will fix this
			data.status = "draft"
		}
	}
	
	const configMap = buildConfigMap(data, config.fields);

	data = await setDefaultValues({
		data,
		adapter: rizom.adapter,
		configMap,
		mode: [ VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED, VERSIONS_OPERATIONS.NEW_VERSION_FROM_LATEST ].includes(versionOperation) ? "always" : "required"
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
