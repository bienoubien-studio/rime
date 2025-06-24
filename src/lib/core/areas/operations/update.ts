import type { RequestEvent } from '@sveltejs/kit';
import type { CompiledArea } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { RizomError } from '$lib/core/errors/index.js';
import { saveBlocks } from '../../operations/blocks/index.server.js';
import { saveTreeBlocks } from '../../operations/tree/index.server.js';
import { saveRelations } from '../../operations/relations/index.server.js';
import type { DeepPartial, Dic, Pretty } from '$lib/util/types.js';
import type { HookContext } from '$lib/core/config/types/hooks.js';

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
	const { config, event, locale, draft } = args;
	let { versionId } = args;
	const { rizom } = event.locals;
	let data = args.data;

	let context: HookContext = {
		params: {
			locale,
			versionId,
			draft
		}
	};

	for (const hook of config.hooks?.beforeOperation || []) {
		const result = await hook({
			config,
			operation: 'update',
			rizom: event.locals.rizom,
			event,
			context
		});
		context = result.context
	}

	for (const hook of config.hooks?.beforeUpdate || []) {
		const result = await hook({
			data,
			config,
			operation: 'update',
			rizom,
			event,
			context
		});
		context = result.context;
		data = result.data as Partial<T>;
	}

	if (!context.configMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing configMap @update');
	if (!context.originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalConfigMap @update');
	if (!context.originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @update');
	if (!context.versionOperation) throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionOperation @update');
	if (!context.params.versionId) throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionId @update');

	const incomingPaths = Object.keys(context.configMap);

	await rizom.adapter.area.update({
		slug: config.slug,
		data,
		locale,
		versionId: context.params.versionId,
		versionOperation: context.versionOperation
	});

	// Use the versionId from the update result for blocks, trees, and relations
	const blocksDiff = await saveBlocks({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		data,
		incomingPaths,
		original: context.originalDoc,
		originalConfigMap: context.originalConfigMap,
		adapter: rizom.adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		ownerId: context.params.versionId,
		configMap: context.configMap,
		data,
		incomingPaths,
		original: context.originalDoc,
		originalConfigMap: context.originalConfigMap,
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

	//@TODO draft should not be true

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
			rizom,
			event,
			context
		});
		context = result.context;
	}

	return document as unknown as T;
};
