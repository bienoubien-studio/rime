import type { HookBeforeUpsert } from '$lib/core/config/types/index.js';
import type { GenericDoc, Prototype } from '../../../../types.js';
import { buildConfigMap } from '../../configMap/index.server.js';

export const buildDataConfigMap: HookBeforeUpsert<Prototype, GenericDoc> = async (args) => {
  const configMap = buildConfigMap(args.data, args.config.fields);
  
  return {
    ...args,
    context: {
      ...args.context,
      configMap 
    }
  }

}
