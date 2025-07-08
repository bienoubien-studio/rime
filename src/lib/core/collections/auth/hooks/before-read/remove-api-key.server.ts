import type { HookBeforeRead } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

export const removeAPIKey: HookBeforeRead<'collection', GenericDoc> = async (args) => {
	let { doc } = args;
	
	delete doc.apiKeyId;
  
	return { ...args, doc };
};
