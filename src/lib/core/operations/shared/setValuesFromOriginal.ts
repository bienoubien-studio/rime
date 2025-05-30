import { logger } from "$lib/core/logger/index.server.js";
import { getValueAtPath, setValueAtPath } from "$lib/util/object.js";
import type { Dic } from "$lib/util/types.js";
import type { ConfigMap } from "../configMap/types.js";

export const setValuesFromOriginal = async <T extends Dic>(args: {
  data: T;
  original: T;
  configMap: ConfigMap;
}) => {
  const { original, configMap } = args;
  let output = { ...args.data };
  for (const [key, config] of Object.entries(configMap)) {
    let value = getValueAtPath(key, output);
    let isEmpty;
    
    try {
      isEmpty = config.isEmpty(value);
    } catch {
      isEmpty = false;
      logger.warn(`Error while checking if field ${key} is empty`);
    }

    if (isEmpty) {
      value = await getValueAtPath(key, original)
      output = setValueAtPath(output, key, value);
    }
  }

  return output;
};