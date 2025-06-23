import type { Area, AreaHooks } from '../../../types.js';
import { setDocumentTitle } from '$lib/core/operations/hooks/before-read/set-document-title.server.js';
import { setDocumentLocale } from '$lib/core/operations/hooks/before-read/set-document-locale.server.js';
import { setDocumentType } from '$lib/core/operations/hooks/before-read/set-document-type.server.js';
import { sortDocumentProps } from '$lib/core/operations/hooks/before-read/sort-document-props.server.js';
import { processDocumentFields } from '$lib/core/operations/hooks/before-read/process-document-fields.server.js';
import { validateFields } from '$lib/core/operations/hooks/before-upsert/validate-fields.server.js';
import { setDefaultValues } from '$lib/core/operations/hooks/before-upsert/set-default-values.server.js';
import { populateURL } from '$lib/core/operations/hooks/before-read/populate-url.server.js';
import { buildDataConfigMap } from '$lib/core/operations/hooks/before-upsert/data-config-map.server.js';

/**
 * Augment an area config with hooks
 */
export const augmentHooks = (area: Area<any>): Area<any> => {
  
  let hooks: Required<AreaHooks<any>> = {
    beforeRead: [
      processDocumentFields,
      setDocumentTitle,
      setDocumentLocale,
      setDocumentType
    ],
    beforeUpdate: [
      buildDataConfigMap,
      setDefaultValues,
      validateFields
    ],
    afterUpdate: []
  };

  if (area.url) {
    hooks = {
      ...hooks,
      beforeRead: [...hooks.beforeRead, populateURL]
    };
  }

  hooks = {
    ...hooks,
    beforeRead: [...hooks.beforeRead, sortDocumentProps]
  };


  return {
    ...area,
    hooks: {
			beforeUpdate: [
				...hooks.beforeUpdate,
				...(area.hooks?.beforeUpdate || [])
			],
			afterUpdate: [
				...hooks.afterUpdate,
				...(area.hooks?.afterUpdate || [])
			],
			beforeRead: [
				...hooks.beforeRead,
				...(area.hooks?.beforeRead || [])
			]
		}
  };
};
