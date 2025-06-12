import type { AugmentCollectionFn } from "./types.js";
import { text } from '$lib/fields/text/index.js';
import { date } from '$lib/fields/date/index.js';

/**
 * Add updatedAt createdAt editedBy fields
 */
export const augmentMetas: AugmentCollectionFn = ({ config, fields }) => {
  fields.push(
    //
    text('editedBy').hidden(),
    date('createdAt').hidden(),
    date('updatedAt').hidden()
  );
  return { config, fields };
};