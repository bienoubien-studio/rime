import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { Rizom } from '$lib/core/rizom.server.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import { transformDocument } from '$lib/core/operations/shared/transformDocument.server.js';
import type { RawDoc } from '$lib/core/types/doc.js';
import type { OperationQuery } from '$lib/core/types/index.js';

type SelectArgs = {
  query?: OperationQuery;
  locale?: string | undefined;
  config: CompiledCollection;
  event: RequestEvent & { locals: App.Locals };
  sort?: string;
  depth?: number;
  limit?: number;
  offset?: number;
  select?: string[]
};

export const select = async <T extends GenericDoc>(args: SelectArgs): Promise<T[]> => {
  //
  const { config, event, locale, sort, limit, offset, depth, query, select = [] } = args;
  const { rizom } = event.locals

  const authorized = config.access.read(event.locals.user, {});
  if (!authorized) {
    throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug);
  }

  const documentsRaw = await rizom.adapter.collection.find({
    slug: config.slug,
    query,
    sort,
    limit,
    offset,
    locale,
    select
  });
  
  const processDocument = async (documentRaw: RawDoc) => {
    let document = await transformDocument<T>({
      raw: documentRaw,
      config,
      locale,
      depth,
      event,
      augment: false,
      withBlank: false
    });
    
    for (const hook of config.hooks?.beforeRead || []) {
      const result = await hook({
        doc: document as unknown as RegisterCollection[CollectionSlug],
        config,
        operation: 'read',
        rizom: event.locals.rizom,
        event
      });
      document = result.doc as unknown as T;
    }

    return document;
  };

  const documents = await Promise.all(documentsRaw.map((doc) => processDocument(doc)));

  return documents;
};
