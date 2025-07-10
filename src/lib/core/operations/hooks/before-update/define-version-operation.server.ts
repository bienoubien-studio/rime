import { getVersionUpdateOperation } from '$lib/core/collections/versions/operations.js';
import { Hooks } from '../index.js';

export const defineVersionOperation = Hooks.beforeUpdate( async (args) => {
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

});
