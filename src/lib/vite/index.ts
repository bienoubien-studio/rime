import type { Plugin, UserConfig } from 'vite';
import dotenv from 'dotenv';
import { RizomError } from '../errors/index.js';
import { hasRunInitCommand } from '../bin/util.server.js';
import { dataToEsm } from '@rollup/pluginutils';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import { log } from 'console';
import { logToFile } from '../../log.js';
// import { generateBrowserConfig } from '../bin/generate/browser/index.js'
import virtual, { updateVirtualModule } from 'vite-plugin-virtual'
import { rizomClient } from './browser.js';

dotenv.config({ override: true });
const dev = process.env.NODE_ENV === 'development';

export function rizom(): Plugin[] {

  return [{
    name: 'rizom:server-client',

    // get virtual:browser-config

    // async resolveId(id) {
    //   if (id === virtualModuleId) {
    //     return resolvedVirtualModuleId
    //   }
    // },

    // should return string 

    // async load(id) {
    //   if (id === resolvedVirtualModuleId) {
    //     const module = await import('../../config/rizom.config.js')
    //     return module.default
    //   }
    // },

    // get anything from ./config
    // 

    // Provide placeholder content for server modules in browser context
    async transform(code, id, options) {
      if (id.includes('src/config/test') && !options?.ssr) {
        // const module = await this.load({id, resolveDependencies: true});
        const foo = this.parse(code)
        console.log(foo)
        for (const node of foo.body) {
          logToFile(node)
        }
        // console.log(module?.meta)
        // console.log(module?.moduleSideEffects)
        // console.log(module?.resolvedBy)
        return dataToEsm({ test: 'test', baz: 'boz' });
      }
      return code
    },

    configureServer(server) {
      // Add a listener for when the server starts
      server.httpServer?.once('listening', () => {
        if (dev && !hasRunInitCommand()) {
          throw new RizomError(RizomError.INIT, 'Missing required files, run `npx rizom-init`');
        }
      });

      // Add a watcher for config changes
      server.watcher.add('src/config/**/*.ts');
      server.watcher.on('change', async (path) => {

        if (path.includes('src/config/rizom.config')) {
          // Make a dummy request to trigger handler
          try {
            const { host, port, https } = server.config.server;
            const protocol = https ? 'https' : 'http';
            const hostname = host === true ? 'localhost' : host || 'localhost';
            const baseUrl = `${protocol}://${hostname}:${port}`;
            await fetch(`${baseUrl}/api/reload-config`, { method: 'POST' });
          } catch (error) {
            console.error('Failed to trigger config reload:', error);
          }
        }
      });
    },

    config(): UserConfig {
      return {
        ssr: {
          external: ['sharp']
        },
        build: {
          rollupOptions: {
            external: ['better-sqlite3', 'sharp']
          },
          target: 'es2022'
        }
      };
    }
  }, rizomClient()]
}


// get the config from the build stuff
// set external as func
// save the result somewhere
// -> how to convert __vite__ssr__ to correct resolved module
// handle it with with


// Hey based on some research I want to maybe implement it like this :
// - use the lagacy buildBrowserConfig to sanitize config but instead of resolving external stuff, let the __vite_ssr__ import transformation strings. So basically the module can't be imported directly and should be consumed by vite somehow
// - save the result inside a temp path
// - then it should be consumed by vite
// - the 'virutal:config' aproach is good I think

// then inside a plugin transform method if id virtual path, I don't knwow what I get here, 
// get the result string from the temp path and return it.
// Maybe parsed __vite_ssr__ with the use of this.resolve(id) and replace with the correct path