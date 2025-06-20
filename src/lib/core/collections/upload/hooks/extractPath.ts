import { RizomError } from '$lib/core/errors/index.js';
import type { CollectionHookBeforeUpsert } from '$lib/core/config/types/hooks.js';
import { trycatchSync } from '$lib/util/trycatch.js';
import { getSegments } from '../util/path.js';

/**
 * Hook executed before save/update operations on {uploadSlug}_directories collections 
 * the function nomalize and validate path ({slug}_directories.id).
 * Then extract parent, name from the given path.
 */
export const exctractPath: CollectionHookBeforeUpsert<any> = async (args) => {
  let data = args.data;
  if (data?.id) {
    const [error, segments] = trycatchSync(() => getSegments(data.id))
    if(error){
      throw new RizomError(RizomError.INVALID_DATA, error.message)
    }
    data = {
      ...data,
      id: segments.path,
      name: segments.name,
      parent: segments.parent,
    }
  }
  return { ...args, data };
};
