import { findTitleField } from "$lib/core/config/build/fields/findTitle.js";
import type { Area } from "../../../types.js";

export const augmentTitle = ( config: Area<any> ) => {
  const fieldTitle = findTitleField(config.fields);
  return {
    ...config,
    asTitle: fieldTitle ? fieldTitle.path : 'id',
  }
}