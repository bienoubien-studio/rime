import { RizomError } from '$lib/core/errors/index.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { DeepPartial } from '$lib/util/types.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { Hook, OperationContext } from '$lib/core/operations/hooks/index.js';
import type { RegisterCollection } from 'rizom';

type Args<T> = {
	id: string;
	versionId?: string;
	draft?: boolean;
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent;
	isFallbackLocale?: boolean;
	isSystemOperation?: boolean;
};

/**
 * Updates a document by ID
 */
export const updateById = async <T extends GenericDoc = GenericDoc>(args: Args<T>) => {
	//
	const { event, locale, id, draft, isFallbackLocale = false, isSystemOperation } = args;
	const { rizom } = event.locals;
	let { data } = args;
	let config = args.config;

	// Set hooks context
	let context: OperationContext<CollectionSlug> = {
		params: {
			id,
			versionId: args.versionId,
			draft,
			locale
		},
		isSystemOperation,
		isFallbackLocale
	};

	for (const hook of config.hooks?.beforeOperation || []) {
		const result = await hook({
			config,
			operation: 'update',
			event,
			context
		});
		context = result.context;
	}

	const hooksBeforeUpdate = config.hooks?.beforeUpdate as Hook<CollectionSlug>[]
	for (const hook of hooksBeforeUpdate || []) {
		const result = await hook({
			data: data as RegisterCollection[CollectionSlug],
			config,
			operation: 'update',
			event,
			context
		});
		config = result.config;
		context = result.context;
		data = result.data as Partial<T>;
	}

	if (!context.configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing configMap @updateById');
	if (!context.originalConfigMap)
		throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalConfigMap @updateById');
	if (!context.originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @updateById');
	if (!context.versionOperation)
		throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionOperation @updateById');
	if (!context.params.versionId) throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionId @updateById');

	const incomingPaths = Object.keys(context.configMap);

	const { id: updatedId } = await rizom.adapter.collection.update({
		id,
		versionId: context.params.versionId,
		slug: config.slug,
		data: data,
		locale: locale,
		versionOperation: context.versionOperation
	});

	const blocksDiff = await saveBlocks({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		originalConfigMap: context.originalConfigMap,
		data,
		incomingPaths,
		original: context.originalDoc,
		adapter: rizom.adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		originalConfigMap: context.originalConfigMap,
		data,
		incomingPaths,
		original: context.originalDoc,
		adapter: rizom.adapter,
		config,
		locale
	});

	await saveRelations({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		data,
		incomingPaths,
		adapter: rizom.adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	let document = await rizom.collection(config.slug).findById({
		//
		id: updatedId,
		locale,
		versionId: context.params.versionId
	});

	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			data: data as RegisterCollection[CollectionSlug],
			config,
			operation: 'update',
			event,
			context
		});
	}

	return document as T;
};
