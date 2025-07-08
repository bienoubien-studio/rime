import type { GenericDoc } from '$lib/core/types/doc.js';
import type { Prototype } from '../../../../types.js';
import { getVersionUpdateOperation } from '$lib/core/collections/versions/operations.js';
import type { HookBeforeUpdate } from '$lib/core/config/types/index.js';

export const defineVersionOperation: HookBeforeUpdate<Prototype, GenericDoc> = async (args) => {
  const { config } = args

  // Define the kind of update operation depending on versions config
  const versionOperation = getVersionUpdateOperation({ 
    draft: args.context.params.draft, 
    versionId: args.context.params.versionId, 
    config 
  });
  
  return {
    ...args,
    context: {
      ...args.context,
      versionOperation
    }
  }

};
