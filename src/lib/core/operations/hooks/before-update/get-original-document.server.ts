import type { GenericDoc } from '$lib/core/types/doc.js';
import type { HookBeforeUpdate, Prototype } from '../../../../types.js';
import { VersionOperations } from '$lib/core/collections/versions/operations.js';
import { RizomError } from '$lib/core/errors/index.js';

export const getOriginalDocument: HookBeforeUpdate<Prototype, GenericDoc> = async (args) => {
	const { rizom, config, context } = args;

	let original;

	if (!context.versionOperation)
		throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionOperation @getOriginalDocument');

	switch (config.type) {
    //
		case 'collection':
			if (!context.params.id) throw new RizomError(RizomError.OPERATION_ERROR, 'missing id @getOriginalDocument');

			original = await rizom.collection(config.slug).findById({
				locale: context.params.locale,
				id: context.params.id,
				versionId: context.params.versionId,
				draft: VersionOperations.shouldRetrieveDraft(context.versionOperation)
			});
			break;
      
		case 'area':
			original = await rizom.area(config.slug).find({
				locale: context.params.locale,
				versionId: context.params.versionId,
				draft: VersionOperations.shouldRetrieveDraft(context.versionOperation)
			});
			break;
	}

	return {
		...args,
		context: {
			...args.context,
			originalDoc: original
		}
	};
};
