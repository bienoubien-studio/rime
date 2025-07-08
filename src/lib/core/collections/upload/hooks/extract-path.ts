import { RizomError } from '$lib/core/errors/index.js';
import type { HookBeforeUpsert } from '$lib/core/config/types/index.js';
import { trycatchSync } from '$lib/util/trycatch.js';
import { getSegments, type UploadPath } from '../util/path.js';
import type { GenericDoc } from '$lib/core/types/doc.js';

/**
 * Hook executed before save/update operations on {uploadSlug}_directories collections 
 * the function nomalize and validate path ({slug}_directories.id).
 * Then extract parent, name from the given path.
 */
export const exctractPath: HookBeforeUpsert<'collection', GenericDoc & { id: UploadPath }> = async (args) => {
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
