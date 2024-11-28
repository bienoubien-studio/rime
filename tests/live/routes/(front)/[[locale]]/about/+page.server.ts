import { debug } from '$src/lib/cms/logger';
import { error, redirect, type ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
  const { api, user, cms } = event.locals;

  let locale = cms.config.getDefaultLocale();
  if (event.params.locale) {
    locale = event.params.locale;
  }
  event.locals.locale = locale;
  if (locale) {
    event.cookies.set('Locale', locale, { path: '.' });
  }

  const doc = await api.global('infos').find({ locale, depth: 1 });

  if (!doc) {
    throw error(404, 'Not found');
  }

  if (user && doc._live && event.url.searchParams.get('live') === '1') {
    return redirect(302, doc._live);
  }

  return { doc: doc };
};
