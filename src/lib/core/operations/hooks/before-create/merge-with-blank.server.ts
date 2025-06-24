import deepmerge from 'deepmerge';
import { isUploadConfig } from '$lib/util/config.js';
import { createBlankDocument } from '$lib/util/doc.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { HookBeforeCreate } from '../../../../types.js';

export const mergeWithBlankDocument: HookBeforeCreate<GenericDoc> = async (args) => {
  const { config } = args
  let data = args.data

  let file;
  if (config.type === 'collection' && isUploadConfig(config) && 'file' in data) {
    file = data.file;
    delete data.file;
  }

  const dataMergedWithBlankDocument = deepmerge(createBlankDocument(config), data);

  // Add file after merge
  if (file) {
    (dataMergedWithBlankDocument as any).file = file;
  }

  return {
    ...args,
    data: dataMergedWithBlankDocument
  }

};
