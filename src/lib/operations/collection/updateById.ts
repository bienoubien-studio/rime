import { type RequestEvent } from '@sveltejs/kit';
import type {
	Adapter,
	LocalAPI,
	GenericDoc,
	CompiledCollection,
	CollectionSlug
} from '$lib/types';
import { RizomError } from '$lib/errors/index.js';
import { usersFields } from '$lib/config/auth/usersFields.js';
import { buildConfigMap } from '../tasks/configMap/index.server.js';
import { validateFields } from '../tasks/validateFields.server.js';
import { setDefaultValues } from '../tasks/setDefaultValues.js';
import { saveBlocks } from '../tasks/blocks/index.server.js';
import { saveTreeBlocks } from '../tasks/tree/index.server.js';
import { saveRelations } from '../tasks/relations/index.server.js';
import type { RegisterCollection } from 'rizom';
import type { DeepPartial } from '$lib/types/util.js';
import { populateURL } from '../tasks/populateURL.server.js';

type Args<T> = {
	id: string;
	versionId?: string;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
	isFallbackLocale: boolean;
};

export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	const { config, event, adapter, locale, api, id, versionId, isFallbackLocale } = args;
	const isVersioned = !!config.versions

	let data = args.data;

	const authorized = config.access.update(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const original = (await api.collection(config.slug).findById({ locale, id, versionId })) as T;

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	const configMap = buildConfigMap(data, config.fields);
	const originalConfigMap = buildConfigMap(original, config.fields);

	data = await setDefaultValues({ data, adapter, configMap });
	
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
	if(!isFallbackLocale){
		for (const hook of config.hooks?.beforeUpdate || []) {
			const result = await hook({
				/**
				 * TS is expecting a more specific types, 
				 * but with RegisterCollection[Slug] devs get their 
				 * types in the hook definition arguments
				 */
				data : data as DeepPartial<RegisterCollection[CollectionSlug]>,
				config,
				originalDoc: original as RegisterCollection[CollectionSlug],
				operation: 'update',
				api,
				rizom: event.locals.rizom,
				event
			});
			data = result.data as Partial<T>;
		}
	}

	const incomingPaths = Object.keys(configMap);

	const updateResult = await adapter.collection.update({
		id,
		versionId,
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
		adapter,
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

	let document = await api.collection(config.slug).findById({ id, locale, versionId: updateResult.versionId });
	
	/**
	 * @TODO handle url generation over all versions ??
	 */

	// Populate URL
	document = await populateURL(document, { config, event, locale })
	
	// If parent has changed populate URL for all language.
	// Note : There is no need to update all localized url as
	// if no parent the url is built with the document data only
	if('parent' in data){
		const locales = event.locals.rizom.config.getLocalesCodes();
		if (locales.length) {
			for(const otherLocale of locales){
				const documentLocale = await api.collection(config.slug).findById({ id, locale: otherLocale, versionId: updateResult.versionId });
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

	return document as T;
};

