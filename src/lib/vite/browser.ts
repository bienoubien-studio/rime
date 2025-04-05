import type { Plugin, ViteDevServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { logger } from '../util/logger/index.server';

/**
 * Vite plugin that serves the browser config as a virtual module
 * This way file imports works without package.json export error
 * Caveats : Vite will not optimize imported modules, so if an error
 * occured, the module should be added to vite config optimizeDeps.include
 */
export function browserConfig(): Plugin {
  const virtualModuleId = 'virtual:browser-config';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  let server: ViteDevServer;
  
  return {
    name: 'rizom:browser-config',
    
    configureServer(_server) {
      server = _server;
      
      // Watch the .rizom directory for changes
      const rizomDir = path.resolve(process.cwd(), '.rizom');
      // if (fs.existsSync(rizomDir)) {
        server.watcher.add(path.join(rizomDir, '**'));
        
        // When any file in .rizom changes, invalidate the module and force reload
        server.watcher.on('change', (changedPath) => {
          if (changedPath.includes('.rizom')) {
            // Force module reload by invalidating the module in the module graph
            const module = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
            if (module) {
              server.moduleGraph.invalidateModule(module);
              logger.info('Browser config changed, forcing full reload');
              
              // Force a full page reload
              server.ws.send({
                type: 'full-reload',
                path: '*'
              });
            }
          }
        });

      // }
    },
    
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    
    load(id) {
      if (id === resolvedVirtualModuleId) {
        try {
          // Path to the generated browser config
          const configPath = path.resolve(process.cwd(), '.rizom/config.browser.txt');
          
          if (fs.existsSync(configPath)) {
            // Read and return the content of the browser config
            return fs.readFileSync(configPath, 'utf-8');
          } else {
            console.warn('Browser config file not found at:', configPath);
            return 'export default {}';
          }
        } catch (error) {
          console.error('Error loading browser config:', error);
          return 'export default {}';
        }
      }
    }
  };
}
