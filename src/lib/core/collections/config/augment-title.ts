import { findTitleField } from "$lib/core/config/build/fields/findTitle.js";
import type { CollectionWithoutSlug } from "./types.js";

/**
 * Set asTitle to the one defined or fallback to
 * filename for upload, email for auth, or id
 */
export const augmentTitle = <T extends CollectionWithoutSlug<any>>(config: T) => {
  const addAsTitle = () => {
    const titleResult = findTitleField(config.fields);
    if (titleResult) return titleResult.path;
    if (config.upload) return 'filename';
    if (config.auth) return 'email';
    return 'id';
  };
  return {
    ...config,
    asTitle: addAsTitle()
  };
};