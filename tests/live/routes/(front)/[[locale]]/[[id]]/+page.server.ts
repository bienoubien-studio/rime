import { Cache } from '$src/lib/cms/cache/cache.server';
import { debug } from '$src/lib/cms/logger';
import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';
import type { ParsedQs } from 'qs';

export const load = async (event: ServerLoadEvent) => {
  let { id } = event.params;
  const { api, user, cms } = event.locals;

  console.time('page');

  const isValidLocale = cms.config.getLocalesCodes().includes(event.params.locale || '');

  let locale: string | undefined = isValidLocale
    ? event.params.locale
    : cms.config.getDefaultLocale();

  if (!id && event.params.locale && !isValidLocale) {
    id = event.params.locale;
  }

  event.locals.locale = locale;

  if (locale) {
    event.cookies.set('Locale', locale, { path: '.' });
  }

  let query: CMS.Query = id
    ? { where: { slug: { equals: id } } }
    : { where: { home: { equals: true } } };

  const loadData = async () => {
    return await api.collection('pages').find({ query, locale, depth: 2 });
  };

  const useCache = cms.config.get('custom.server.cache') && !user;

  const docs = useCache
    ? await Cache.get<CMS.PagesDoc[]>(event.url.href, loadData)
    : await loadData();

  if (!docs.length) {
    throw error(404, 'Not found');
  }

  if (user && docs[0]._live && event.url.searchParams.get('live') === '1') {
    return redirect(302, docs[0]._live);
  }

  console.timeEnd('page');
  return { doc: docs[0] };
};
