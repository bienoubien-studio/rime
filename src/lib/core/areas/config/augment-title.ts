import { findTitleField } from "$lib/core/config/build/fields/findTitle.js";
import type { AreaWithoutSlug } from "./types.js";

export const augmentTitle = ( config: AreaWithoutSlug<any> ) => {
  const fieldTitle = findTitleField(config.fields);
  return {
    ...config,
    asTitle: fieldTitle ? fieldTitle.path : 'id',
  }
}