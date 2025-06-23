import type { GenericDoc, HookBeforeUpsert, Prototype } from '../../../../types.js';
import { buildConfigMap } from '../../configMap/index.server.js';

export const buildDataConfigMap: HookBeforeUpsert<Prototype, GenericDoc> = async (args) => {

  const configMap = buildConfigMap(args.data, args.config.fields);
  
  return {
    ...args,
    metas: {
      ...args.metas,
      configMap 
    }
  }

}