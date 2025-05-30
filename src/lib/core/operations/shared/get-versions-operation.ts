import { RizomError } from "$lib/core/errors/index.js";
import type { CompiledArea, CompiledCollection } from "../../../types.js";

export const VERSIONS_OPERATIONS = {
  UPDATE : 0,
  UPDATE_PUBLISHED : 1,
  UPDATE_VERSION : 2,
  NEW_VERSION_FROM_LATEST : 3,
  NEW_DRAFT_FROM_PUBLISHED : 4,
}

type Args = {
  draft?: boolean;
  versionId?: string;
  config: CompiledArea | CompiledCollection
}

/**
 * Determines the appropriate version update operation based on configuration and parameters
 * 
 * This function analyzes the current context (draft mode, version ID, configuration) 
 * and returns the appropriate operation type to perform when updating documents:
 * 
 * - For non-versioned documents: always returns UPDATE
 * - For versioned documents without draft support: returns UPDATE_VERSION if versionId provided, 
 *   otherwise NEW_VERSION_FROM_LATEST
 * - For versioned documents with draft support: returns UPDATE_VERSION if versionId provided,
 *   NEW_DRAFT_FROM_PUBLISHED if draft=true, or UPDATE_PUBLISHED if draft=false
 * 
 * @returns - The operation type constant from VERSIONS_OPERATIONS
 */
export function getVersionUpdateOperation ({ draft, versionId, config }: Args) {
  // always update only for unversioned
  if( !config.versions ){
    return VERSIONS_OPERATIONS.UPDATE
  }
  // Handle versionned area/collections
  if(config.versions){
    // always update the provided versionId if defined
    if(versionId){
      return VERSIONS_OPERATIONS.UPDATE_VERSION
    }
    // when config.versions.draft not enabled
    // no versionId here so create a new version
    if( !config.versions.draft ){
      return VERSIONS_OPERATIONS.NEW_VERSION_FROM_LATEST
    }

    if( config.versions.draft){
      if(draft){
        return VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED
      }else{
        return VERSIONS_OPERATIONS.UPDATE_PUBLISHED
      }
    }
  }

  throw new RizomError(RizomError.OPERATION_ERROR, "this case is not support for now")
}