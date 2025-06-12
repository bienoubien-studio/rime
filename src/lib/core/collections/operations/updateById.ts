import path from 'node:path';
import { RizomError } from '$lib/core/errors/index.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import { buildConfigMap } from '../../operations/configMap/index.server.js';
import { validateFields } from '$lib/core/operations/shared/validateFields.server.js';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import { setValuesFromOriginal } from '$lib/core/operations/shared/setValuesFromOriginal.js';
import { filePathToFile } from '../upload/util/converter.js';
import {
	getVersionUpdateOperation,
	VersionOperations,
	type VersionOperation
} from '$lib/core/operations/shared/versions.js';
import { type RequestEvent } from '@sveltejs/kit';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { RegisterCollection } from '$lib/index.js';
import type { DeepPartial, Dic } from '$lib/util/types.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import { makeVersionsSlug } from '$lib/util/schema.js';
import type { Rizom } from '$lib/core/rizom.server.js';

type Args<T> = {
	id: string;
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	isFallbackLocale?: boolean;
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
	config: CompiledCollection;
	rizom: Rizom;
	locale?: string;
	originalConfigMap: Record<string, any>;
}): Promise<string> {
	// Handle specific version updates
	if (VersionOperations.isSpecificVersionUpdate(versionOperation)) {
		return original.versionId;
	}

	// Handle new version creation
	if (VersionOperations.isNewVersionCreation(versionOperation)) {
		// Add the original file if we are on an upload collection
		if (config.upload && !data.file && original.filename) {
			// Create a File object from the existing file path
			const filePath = path.resolve(process.cwd(), 'static', 'medias', original.filename);
			try {
				data.file = await filePathToFile(filePath);
			} catch (err) {
				console.error(`Failed to create file from path: ${filePath}`, err);
			}
		}

		// Use missing data from original version
		data = await setValuesFromOriginal({ data, original, configMap: originalConfigMap });

		// Set default status to "draft" if no data.status
		if (!data.status) {
			data.status = VERSIONS_STATUS.DRAFT;
		}

		data.ownerId = original.id;
		delete data.id;

		const versionsSlug = makeVersionsSlug(config.slug);

		const { doc } = await rizom.collection(versionsSlug).create({ data, locale });

		if (config.versions && config.versions.maxVersions) {
			await rizom.collection(versionsSlug).delete({
				sort: '-updatedAt',
				query: 'where[status][not_equals]=published',
				offset: config.versions.maxVersions
			});
		}

		return doc.id;
	}

	// Handle simple update (no version)
	return original.id;
}

/**
 * Updates a document by ID with version handling support
 *
 * Handles different version operations including:
 * - Regular updates to the current version
 * - Updates to specific versions
 * - Creation of new versions
 *
 * Performs validation, saves related blocks and relations,
 * and returns the updated document with populated URLs
 */
export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	const { config, event, locale, id, isFallbackLocale = false } = args;
	const { rizom } = event.locals;
	let versionId = args.versionId;
	let data = args.data;

	// Check for authorization
	const authorized = config.access.update(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	// Define the kind of update operation depending on versions config
	const versionOperation = getVersionUpdateOperation({ draft: args.draft, versionId, config });
	
	// Get original document, we need it for hooks and possible version creation
	const original = (await rizom.collection(config.slug).findById({
		locale,
		id,
		versionId,
		draft: VersionOperations.shouldRetrieveDraft(versionOperation)
	})) as T;

	// Add auth fields into validation process
	if (config.auth) {
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	// Build the original ConfigMap needed for :
	// - merging with original document for version creation
	// - Blocks & Tree diff
	const originalConfigMap = buildConfigMap(original, config.fields);

	// Handle version-specific operations and get the versionId
	versionId = await handleVersionCreation({
		versionOperation,
		original,
		data,
		config,
		rizom,
		locale,
		originalConfigMap
	});

	// build the config map according to the augmented data
	const configMap = buildConfigMap(data, config.fields);

	// Set default values for missings ones
	// for example if a field has been deleted but is required
	data = await setDefaultValues({
		data,
		adapter: rizom.adapter,
		configMap,
		mode: 'required'
	});

	data = await validateFields({
		data,
		event,
		locale,
		original,
		config,
		configMap,
		operation: 'update'
	});

	// We do not re-run hooks on locale fallbackCreation
	if (!isFallbackLocale) {
		for (const hook of config.hooks?.beforeUpdate || []) {
			const result = await hook({
				/**
				 * TS is expecting a more specific types,
				 * but with RegisterCollection[Slug] devs get their
				 * types in the hook definition arguments
				 */
				data: data as DeepPartial<RegisterCollection[CollectionSlug]>,
				config,
				originalDoc: original as RegisterCollection[CollectionSlug],
				operation: 'update',
				rizom: event.locals.rizom,
				event,
				metas: {}
			});
			data = result.data as Partial<T>;
		}
	}

	const incomingPaths = Object.keys(configMap);

	await rizom.adapter.collection.update({
		id,
		versionId,
		slug: config.slug,
		data: data,
		locale: locale,
		versionOperation
	});

	const blocksDiff = await saveBlocks({
		ownerId: versionId,
		configMap,
		originalConfigMap,
		data,
		incomingPaths,
		original,
		adapter: rizom.adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: versionId,
		configMap,
		originalConfigMap,
		data,
		incomingPaths,
		original,
		adapter: rizom.adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: versionId,
		configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	let document = await rizom.collection(config.slug).findById({ id, locale, versionId: versionId });
	
	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			config,
			operation: 'update',
			rizom: event.locals.rizom,
			event,
			metas: {}
		});
	}
	
	return document as T;
};
