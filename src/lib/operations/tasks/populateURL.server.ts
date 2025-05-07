import type { GenericDoc } from "rizom/types/doc.js";
import type { CompiledArea, CompiledCollection } from '$lib/types/config.js';
import type { RequestEvent } from "@sveltejs/kit";
import { getValueAtPath } from "rizom/util/object";
import { logger } from "rizom/util/logger/index.server";

export const populateURL = async <T extends GenericDoc>(
  document: T,
  context: {
    event: RequestEvent,
    locale?: string,
    config: CompiledCollection | CompiledArea
  }): Promise<T> => {

  const { config, event, locale } = context
  
  if (config.url) {

    let url

    try {
      url = config.url(document as any)
    } catch (err) {
      return document
    }

    const match = url.match(/\[\.\.\.parent\.(\w+(?:\.\w+)*)\]/);

    if (match) {
      const fullMatch = match[0];
      const attributePath = match[1];

      // Create array to store parent attributes
      let attributesArray: string[] = [];
      let parent = Array.isArray(document.parent) && document.parent.length ? document.parent[0] : null
      const MAX_DEPTH = 6
      let depth = 0

      while (parent && depth < MAX_DEPTH) {
        depth++
        let parentId
        if ('documentId' in parent) {
          parentId = parent.documentId
        } else {
          parentId = parent.id
        }

        const docs = await event.locals.api.collection(config.slug as any).select({
          query: `where[id][equals]=${parentId}`,
          select: [attributePath],
          locale
        });

        // Check if there is a result
        if (docs && docs.length > 0) {
          const parentDoc = docs[0];
          const parentAttribute = getValueAtPath(attributePath, parentDoc);

          if (parentAttribute && typeof parentAttribute === 'string') {
            attributesArray.push(parentAttribute);
          } else if (parentAttribute) {
            logger.warn('Bad URL property: not a string', { attributePath, parentAttribute });
          }

          // Move up to the next parent
          parent = parentDoc.parent && Array.isArray(parentDoc.parent) && parentDoc.parent.length > 0
            ? parentDoc.parent[0]
            : null;
        } else {
          parent = null;
        }
      }

      if (attributesArray.length) {
        // Replace the parent reference with the joined attributes
        url = url.replace(fullMatch, attributesArray.reverse().join('/'))
      } else {
        url = url.replace('/' + fullMatch, '')
      }

    } else {
      // replace "/[...parent.whatever.something.foo]" with ""
      url = url.replace(/\/\[\.\.\.parent\.\w+(?:\.\w+)*\]/, '')
    }
    
    if(document.url !== url){
      document.url = url
      await event.locals.rizom.adapter.collection.update({ slug: config.slug, id: document.id, locale, data: { url }})
    }

  }
  return document
}