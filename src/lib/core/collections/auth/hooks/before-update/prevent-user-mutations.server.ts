import type { HookBeforeUpdate } from "$lib/core/config/types/index.js";
import { RizomError } from "$lib/core/errors/index.js";
import type { GenericDoc } from "$lib/core/types/doc.js";

/**
* Before update :
* - prevent email/name/password to be changed
*/
export const preventUserMutations: HookBeforeUpdate<'collection', GenericDoc> = async (args) => {
	
	const IS_MUTATION_AUTH = 'email' in args.data || 'name' in args.data || 'password' in args.data
	
	if(IS_MUTATION_AUTH && args.config.auth){
		if(args.context.isFallbackLocale){
			delete args.data.password
		}else{
			throw new RizomError(RizomError.UNAUTHORIZED);
		}
	}
	
	return args;
};