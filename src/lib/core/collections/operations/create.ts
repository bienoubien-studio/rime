import cloneDeep from 'clone-deep';
import { RizomError } from '$lib/core/errors/index.js';
import { usersFields } from '$lib/core/collections/auth/config/usersFields.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import type { DeepPartial, Dic } from '$lib/util/types.js';

type Args<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & {
		locals: App.Locals;
	};
};

export const create = async <T extends GenericDoc>(args: Args<T>) => {
	const { config, event, locale } = args;
	const { rizom } = event.locals;

	let data = args.data;
	const incomingData = cloneDeep(data);
	//

	const authorized = config.access.create(event.locals.user, { id: undefined });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	let metas: Dic = {}
	
	for (const hook of config.hooks?.beforeCreate || []) {
		const result = await hook({
			data,
			config,
			operation: 'create',
			rizom: event.locals.rizom,
			event,
			metas
		});
		metas = result.metas
		data = result.data as Partial<T>;
	}
	
	if (!metas.configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing config map @create')

	const incomingPaths = Object.keys(metas.configMap);

	const created = await rizom.adapter.collection.insert({
		slug: config.slug,
		data,
		locale
	});

	// Use the versionId for blocks, trees, and relations
	const blocksDiff = await saveBlocks({
		ownerId: created.versionId,
		configMap: metas.configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: created.versionId,
		configMap: metas.configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: created.versionId,
		configMap: metas.configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	// Use the document ID to find the created document
	let document = (await rizom
		.collection(config.slug)
		.findById({ id: created.id, locale, versionId: created.versionId })) as T;

	if (locale) {
		const locales = event.locals.rizom.config.getLocalesCodes();

		if (locales.length) {
			// Remove unwanted values on fallback
			if ('file' in incomingData) {
				delete incomingData.file;
			}
			if ('filename' in incomingData) {
				delete incomingData.filename;
			}
			if ('password' in incomingData) {
				delete incomingData.password;
			}
			if ('confirmPassword' in incomingData) {
				delete incomingData.confirmPassword;
			}
			// Get locales
			const otherLocales = locales.filter((code) => code !== locale);
			for (const otherLocale of otherLocales) {
				rizom.setLocale(otherLocale);
				await rizom.collection(config.slug).updateById({
					id: created.id,
					versionId: created.versionId,
					data: incomingData as DeepPartial<RegisterCollection[CollectionSlug]>,
					locale: otherLocale,
					isFallbackLocale: true
				});
			}
		}
		rizom.setLocale(locale);
	}
	
	for (const hook of config.hooks?.afterCreate || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'create',
			rizom: event.locals.rizom,
			event,
			metas
		});
	}

	return document;
};
