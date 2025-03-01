import { type RequestEvent } from '@sveltejs/kit';
import type {
	Adapter,
	LocalAPI,
	CollectionSlug,
	GenericDoc,
	CompiledCollection
} from 'rizom/types';
import type { RegisterCollection } from 'rizom';
import { RizomError } from 'rizom/errors/index.js';
import { usersFields } from 'rizom/collection/auth/usersFields.js';
import { buildConfigMap } from '../tasks/configMap/index.server.js';
import { validateFields } from '../tasks/validateFields.server.js';
import { setDefaultValues } from '../tasks/setDefaultValues.js';
import { saveBlocks } from '../tasks/blocks/index.server.js';
import { saveTreeBlocks } from '../tasks/tree/index.server.js';
import { saveRelations } from '../tasks/relations/index.server.js';

type Args<T extends GenericDoc = GenericDoc> = {
	id: string;
	data: Partial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	api: LocalAPI;
	adapter: Adapter;
};

export const updateById = async <T extends RegisterCollection[CollectionSlug]>(args: Args<T>) => {
	const { config, event, adapter, locale, api, id } = args;
	let data = args.data;

	const authorized = config.access.update(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const original = await api.collection(config.slug).findById({ locale, id });

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	const configMap = buildConfigMap(data, config.fields);
	data = await setDefaultValues({ data, adapter, configMap });
	data = await validateFields({
		data,
		api,
		locale,
		original,
		config,
		configMap,
		operation: 'create',
		user: event.locals.user
	});

	for (const hook of config.hooks?.beforeUpdate || []) {
		const result = await hook({
			data,
			config,
			originalDoc: original,
			operation: 'update',
			api,
			rizom: event.locals.rizom,
			event
		});
		data = result.data as Partial<T>;
	}

	await adapter.collection.update({
		id,
		slug: config.slug,
		data: data,
		locale: locale
	});

	const blocksDiff = await saveBlocks({
		parentId: original.id,
		configMap,
		data,
		original,
		adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		parentId: original.id,
		configMap,
		data,
		original,
		adapter,
		config,
		locale
	});

	await saveRelations({
		parentId: original.id,
		configMap,
		data,
		adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	const document = await api.collection(config.slug).findById({ id, locale });

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
