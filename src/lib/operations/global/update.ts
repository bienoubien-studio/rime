import rizom from '$lib/rizom.server.js';
import { extractBlocks } from '../preprocess/extract/blocks.server.js';
import { extractRelations } from '../preprocess/extract/relations.server.js';
import { safeFlattenDoc } from '../../utils/doc.js';
import { buildConfigMap } from '../preprocess/config/map.js';
import { preprocessFields } from '../preprocess/fields.server.js';
import { RizomAccessError } from '../../errors/access.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { LocalAPI } from 'rizom/types/api.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { BuiltGlobalConfig } from 'rizom/types/config.js';
import type { Adapter } from 'rizom/types/adapter.js';
import type { Dic } from 'rizom/types/utility.js';

type UpdateArgs<T extends GenericDoc = GenericDoc> = {
	data: Partial<T>;
	locale?: string | undefined;
	config: BuiltGlobalConfig;
	event?: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
};

export const update = async <T extends GenericDoc = GenericDoc>({
	data,
	locale,
	config,
	api,
	event,
	adapter
}: UpdateArgs<T>) => {
	//////////////////////////////////////////////
	// Access
	//////////////////////////////////////////////
	if (event) {
		const authorized = api.hasGrantedPrivilege || config.access.update(event.locals.user);
		if (!authorized) {
			throw new RizomAccessError('- trying to update ' + config.slug);
		}
	}

	const originalDoc = await api.global(config.slug).find({ locale });

	//////////////////////////////////////////////
	// Hooks BeforeUpdate
	//////////////////////////////////////////////

	if (config.hooks && config.hooks.beforeUpdate) {
		for (const hook of config.hooks.beforeUpdate) {
			const args = await hook({
				operation: 'update',
				config,
				data,
				originalDoc,
				event,
				rizom,
				api
			});
			data = args.data;
			event = args.event;
		}
	}

	/** Flatten data once for all */
	let flatData: Dic = safeFlattenDoc(data);
	const configMap = buildConfigMap(data, config.fields);

	const { errors, validData, validFlatData } = await preprocessFields({
		data,
		flatData,
		configMap,
		operation: 'update',
		documentId: originalDoc.id,
		user: event?.locals.user,
		slug: config.slug,
		locale,
		rizom
	});

	if (errors) {
		return { errors };
	} else {
		data = validData as T;
		flatData = validFlatData;
	}

	//////////////////////////////////////////////
	// Update data
	//////////////////////////////////////////////

	const { blocks, paths: blocksPaths } = extractBlocks(data, configMap);
	const { relations } = extractRelations({ flatData, configMap, locale });

	let doc = await adapter.global.update({ slug: config.slug, data, locale });

	/** Deleted blocks */
	const deletedBlocks = await adapter.blocks.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: [...new Set(blocksPaths)]
	});

	/** Create blocks */
	for (const block of blocks) {
		adapter.blocks.createBlock({
			parentSlug: config.slug,
			parentId: doc.id,
			block,
			locale
		});
	}

	/** Delete Localized Relations */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: [
			...relations.map((relation) => relation.path).filter((path) => configMap[path].localized)
		],
		locale
	});

	/** Delete Unlocalized Relations & relations in Blocks */
	await adapter.relations.deleteFromPaths({
		parentSlug: config.slug,
		parentId: doc.id,
		paths: [
			...deletedBlocks.map((block) => `${block.path}.${block.position}`),
			...relations.map((relation) => relation.path).filter((path) => !configMap[path].localized)
		]
	});

	/** Update Relations */
	await adapter.relations.updateOrCreate({
		parentSlug: config.slug,
		parentId: doc.id,
		relations
	});

	const rawDoc = (await adapter.global.get({ slug: config.slug, locale })) as T;
	doc = await adapter.transform.doc<T>({ doc: rawDoc, slug: config.slug, locale, event, api });

	return doc as T;
};
