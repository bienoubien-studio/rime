import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { AreaSlug, Rizom } from '$lib/types.js';
import { RizomError } from '$lib/core/errors/index.js';
import { buildConfigMap } from '../../operations/configMap/index.server.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { DeepPartial, Dic, Pretty } from '$lib/util/types.js';
import type { RegisterArea } from '$lib/index.js';
import { setValuesFromOriginal } from '$lib/core/operations/shared/setValuesFromOriginal.js';


import {
	getVersionUpdateOperation,
	VersionOperations,
	type VersionOperation
} from '$lib/core/collections/versions/operations.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import { makeVersionsSlug } from '$lib/util/schema.js';

type UpdateArgs<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	versionId?: string;
	draft?: boolean;
};

/**
 * Handles version-related operations for document updates
 * Manages specific version updates and new version creation
 */
async function handleVersionCreation<T extends GenericDoc>({
	versionOperation,
	original,
	data,
	config,
	rizom,
	locale,
	originalConfigMap
}: {
	versionOperation: VersionOperation;
	original: T;
	data: Dic;
	config: CompiledArea;
	rizom: Rizom;
	locale?: string;
	originalConfigMap: Record<string, any>;
}): Promise<string> {

	if (VersionOperations.isSpecificVersionUpdate(versionOperation)) {
		return original.versionId;
	}

	if (VersionOperations.isNewVersionCreation(versionOperation)) {
		data = await setValuesFromOriginal({ data, original, configMap: originalConfigMap });
		if (!data.status) {
			data.status = VERSIONS_STATUS.DRAFT;
		}
		
		data.ownerId = original.id;
		delete data.id;

		const versionsSlug = makeVersionsSlug(config.slug);

		const doc = await rizom.collection(versionsSlug).create({
			data,
			locale
		});
		
		if (config.versions && config.versions.maxVersions) {
			await rizom.collection(versionsSlug).delete({
				sort: '-updatedAt',
				query: 'where[status][not_equals]=published',
				offset: config.versions.maxVersions
			});
		}

		return doc.id;
	}

	return original.id;
}

export const update = async <T extends GenericDoc = GenericDoc>(args: UpdateArgs<T>) => {
	//
	const { config, event, locale } = args;
	const { rizom } = event.locals;
	let data = args.data;
	let versionId = args.versionId;

	// Check authorization
	const authorized = config.access.update(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Define the kind of update operation depending on versions config
	const versionOperation = getVersionUpdateOperation({ draft: args.draft, versionId, config });

	// Allow draft version to be retrieved in specific scenarios
	// In all other cases the "published" document is used
	const original = (await rizom.area(config.slug).find({
		locale,
		versionId,
		draft: VersionOperations.shouldRetrieveDraft(versionOperation)
	})) as unknown as T;

	const originalConfigMap = buildConfigMap(original, config.fields);

	versionId = await handleVersionCreation({
		versionOperation,
		original,
		data,
		config,
		rizom,
		locale,
		originalConfigMap
	});

	let metas: Dic = { versionOperation }
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
			event,
			metas
		});
		metas = result.metas
		data = result.data as Partial<T>;
	}

	if (!metas.configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing config map @update')

	const incomingPaths = Object.keys(metas.configMap);

	await rizom.adapter.area.update({
		slug: config.slug,
		data,
		locale,
		versionId,
		versionOperation
	});

	// Use the versionId from the update result for blocks, trees, and relations
	const blocksDiff = await saveBlocks({
		ownerId: versionId,
		configMap: metas.configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter: rizom.adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: versionId,
		configMap: metas.configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter: rizom.adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: versionId,
		configMap: metas.configMap,
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
		versionId: versionId,
		draft: true
	});

	for (const hook of config.hooks?.afterUpdate || []) {
		const result = await hook({
			doc: document,
			config,
			operation: 'update',
			rizom: event.locals.rizom,
			event,
			metas
		});
		metas = result.metas
	}

	return document as unknown as T;
};
