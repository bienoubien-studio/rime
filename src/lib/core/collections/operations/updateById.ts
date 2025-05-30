import { type RequestEvent } from '@sveltejs/kit';
import type {
	Adapter,
	Rizom,
	GenericDoc,
	CompiledCollection,
	CollectionSlug
} from '$lib/types';
import { RizomError } from '$lib/core/errors/index.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import { buildConfigMap } from '../../operations/configMap/index.server.js';
import { validateFields } from '$lib/core/operations/shared/validateFields.server.js';
import { setDefaultValues } from '$lib/core/operations/shared/setDefaultValues.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { RegisterCollection } from '$lib/index.js';
import type { DeepPartial } from '$lib/util/types.js';
import { populateURL } from '$lib/core/operations/shared/populateURL.server.js';
import { setValuesFromOriginal } from '$lib/core/operations/shared/setValuesFromOriginal.js';
import { filePathToFile } from '../upload/util/converter.js';
import path from 'node:path';

type Args<T> = {
	id: string;
	versionId?: string;
	newDraft?: boolean;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	isFallbackLocale: boolean;
};

export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	const { config, event, locale, id, versionId, newDraft, isFallbackLocale } = args;
	const { rizom } = event.locals

	let data = args.data;

	const authorized = config.access.update(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const original = (await rizom.collection(config.slug).findById({ locale, id, versionId, draft: true })) as T;

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	const originalConfigMap = buildConfigMap(original, config.fields);

	// If we are not updating a specific existing versions
	// add fields from the original, that way required field values will be present
	if (config.versions && newDraft) {
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
	}

	const configMap = buildConfigMap(data, config.fields);
	
	data = await setDefaultValues({ 
		data, 
		adapter: rizom.adapter, 
		configMap,
		mode: "required"
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
				event
			});
			data = result.data as Partial<T>;
		}
	}

	const incomingPaths = Object.keys(configMap);

	const updateResult = await rizom.adapter.collection.update({
		id,
		versionId,
		newDraft,
		slug: config.slug,
		data: data,
		locale: locale
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
