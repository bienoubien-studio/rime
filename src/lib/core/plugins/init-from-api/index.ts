import { handleError } from '$lib/core/errors/handler.server.js';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import type { Plugin } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const initFromAPI: Plugin<never> = () => {
  
  const apiInit: RequestHandler = async (event) => {
    try {
      const { email, password, name } = await extractData(event.request);
      await event.locals.api.createFirstPanelUser({ email, password, name });
      return json({ initialized: true });
    } catch (err: any) {
      throw handleError(err, { context: 'api' });
    }
  };
  
  return {
    name: 'initFromAPI',
    core: true,
    routes: {
      '/api/init': {
        POST: apiInit
      }
    },
  };
};
