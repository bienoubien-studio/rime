import { RizomError } from '$lib/core/errors/index.js';
import type { GenericDoc, HookBeforeUpsert, Prototype } from '../../../../types.js';
import { buildConfigMap } from '../../configMap/index.server.js';

export const buildOriginalDocConfigMap: HookBeforeUpsert<Prototype, GenericDoc> = async (args) => {
  const { originalDoc } = args.context

  if(!originalDoc) throw new RizomError(RizomError.OPERATION_ERROR, 'missing originalDoc @buildDataConfigMap')
    
  const originalConfigMap = buildConfigMap(originalDoc, args.config.fields);
  
  return {
    ...args,
    context: {
      ...args.context,
      originalConfigMap 
    }
  }

}