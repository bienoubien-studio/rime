// import { dev } from '$app/environment';
import { handleError } from '$lib/core/errors/handler.server.js';
import { RizomError } from '$lib/core/errors/index.js';
import { extractData } from '$lib/core/operations/extract-data.server.js';
import type { Plugin } from '$lib/types';
import { json, type RequestHandler } from '@sveltejs/kit';

export const apiInit: Plugin<never> = () => {
  
  const requestHandler: RequestHandler = async (event) => {
    // if(!dev) throw new RizomError(RizomError.INIT, 'Could not init outside of a dev environment.')
    try {
      const { email, password, name } = await extractData(event.request);
      await event.locals.rizom.createFirstPanelUser({ email, password, name });
      return json({ initialized: true });
    } catch (err: any) {
      throw handleError(err, { context: 'api' });
    }
  };
  
  return {
    name: 'apiInit',
    core: true,
    routes: {
      '/api/init': {
        POST: requestHandler
      }
    }
  };
};
