import path from 'node:path';
import { RizomError } from '$lib/core/errors/index.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import { buildConfigMap } from '../../operations/configMap/index.server.js';
import { validateFields } from '$lib/core/operations/shared/validateFields.server.js';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import { populateURL } from '$lib/core/operations/shared/populateURL.server.js';
import { setValuesFromOriginal } from '$lib/core/operations/shared/setValuesFromOriginal.js';
import { filePathToFile } from '../upload/util/converter.js';
import { getVersionUpdateOperation, VersionOperations } from '$lib/core/operations/shared/versions.js';
import { type RequestEvent } from '@sveltejs/kit';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { RegisterCollection } from '$lib/index.js';
import type { DeepPartial } from '$lib/util/types.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';

type Args<T> = {
	id: string;
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	isFallbackLocale: boolean;
};

export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	const { config, event, locale, id, isFallbackLocale } = args;
	const { rizom } = event.locals
	let versionId = args.versionId
	let data = args.data;
	
	// Check for authorization
	const authorized = config.access.update(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}
	
	// Define the kind of update operation depending on versions config
	const versionOperation = getVersionUpdateOperation({ draft: args.draft, versionId, config })

	const original = (await rizom.collection(config.slug).findById({ 
		locale, 
		id, 
		versionId, 
		draft: VersionOperations.shouldRetrieveDraft(versionOperation)
	})) as T;

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}
	
	// set the versionId from the original to update the proper version if none provided
	if (config.versions && !versionId) {
		versionId = original.versionId
	}

	const originalConfigMap = buildConfigMap(original, config.fields);

	// For new versions creation scenario, add data from the original doc
	// This ensures required field values will be present when creating the new version
	// Also get the original file if we are on an upload collection
	if (config.versions && VersionOperations.isNewVersionCreation(versionOperation)) {
		// Check if you should add the original file if exists and if data hasn't a file prop
		if (config.upload && !data.file && original.filename) {
			// Create a File object from the existing file path
			const filePath = path.resolve(process.cwd(), 'static', 'medias', original.filename);
			try {
				//@ts-expect-error I don't care it exists on DeepPartial<T>
				data.file = await filePathToFile(filePath);
			} catch (err) {
				console.error(`Failed to create file from path: ${filePath}`, err);
			}
		}
		data = await setValuesFromOriginal({ data, original, configMap: originalConfigMap })
		if (config.versions.draft && !data.status) {
			//@ts-ignore will fix this
			data.status = VERSIONS_STATUS.DRAFT
		}
	}

	// build the config map according to the augmented data
	const configMap = buildConfigMap(data, config.fields);

	data = await setDefaultValues({ 
		data, 
		adapter: rizom.adapter, 
		configMap,
		mode: VersionOperations.isNewVersionCreation(versionOperation) ? "always" : "required"
	});
	
	// For versions creation set default values for all empty fields
	// in all other case set only for required and empties
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
				event
			});
			data = result.data as Partial<T>;
		}
	}

	const incomingPaths = Object.keys(configMap);

	const updateResult = await rizom.adapter.collection.update({
		id,
		versionId,
		slug: config.slug,
		data: data,
		locale: locale,
		versionOperation
	});

	const blocksDiff = await saveBlocks({
		ownerId: updateResult.versionId,
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
		ownerId: updateResult.versionId,
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

	let document = await rizom.collection(config.slug).findById({ id, locale, versionId: updateResult.versionId });

	/**
	 * @TODO handle url generation over all versions ??
	 */

	// Populate URL
	document = await populateURL(document, { config, event, locale })

	// If parent has changed populate URL for all language.
	// Note : There is no need to update all localized url as
	// if no parent the url is built with the document data only
	if ('parent' in data) {
		const locales = event.locals.rizom.config.getLocalesCodes();
		if (locales.length) {
			for (const otherLocale of locales) {
				const documentLocale = await rizom.collection(config.slug).findById({ id, locale: otherLocale, versionId: updateResult.versionId });
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

	return document as T;
};
