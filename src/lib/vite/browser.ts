import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Virtual module ID
const VIRTUAL_MODULE_ID = 'virtual:browser-config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const GENERATED_CONFIG_PATH = path.join(process.cwd(), '.rizom', 'config.browser.txt');
const CONFIG_PATH = path.join(process.cwd(), 'src', 'config');

export function rizomClient(): Plugin {
  return {
    name: 'rizom:browser-config',

    // enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    async load(id) {
      // if (id.includes('node_modules/.pnpm/@lucide+svelte')) {
      //   console.log(this.getModuleInfo(id))
      // }
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        try {
          // Check if the config file exists
          if (!fs.existsSync(GENERATED_CONFIG_PATH)) {
            console.warn(`[rizom] Browser config file not found at ${GENERATED_CONFIG_PATH}`);
            return 'export default {}';
          }

          // Read the config file
          let content = fs.readFileSync(GENERATED_CONFIG_PATH, 'utf-8');

          // Return the content for further processing in transform
          return content;
        } catch (error) {
          console.error('[rizom] Error loading browser config:', error);
          return 'export default {}';
        }
      }
    },

    configureServer(server) {
      server.watcher.add('src/config/**/*.ts');
      server.watcher.on('change', async (path) => {
        const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (module) {
            server.moduleGraph.invalidateModule(module);
            console.log('[rizom] Browser config invalidated');
          }
      })
        
    }

    // async transform(code, id) {
    //   if (id === RESOLVED_VIRTUAL_MODULE_ID) {
    //     let processedCode = code;

    //     // Find all import statements for external modules
    //     const importRegex = /import\s+(__extenal__\d+)\s+from\s+'([^']+)';/g;
    //     let importMatch;

    //     // Create a map to store replacements
    //     const replacements = [];

    //     // First pass: collect all external imports and resolve their paths
    //     while ((importMatch = importRegex.exec(code)) !== null) {
    //       const importVar = importMatch[1];
    //       const importPath = importMatch[2];
    //       const importId = importVar.split('__extenal__')[1];

    //       // Resolve the import path
    //       const resolved = await this.resolve(importPath);

    //       if (resolved && resolved.id) {
    //         // Store the replacement info
    //         replacements.push({
    //           importVar,
    //           importPath,
    //           importId,
    //           resolvedPath: resolved.id
    //         });
    //       } else {
    //         console.warn(`[rizom] Failed to resolve import: ${importPath}`);
    //       }
    //     }

    //     // Second pass: perform the replacements
    //     for (const { importVar, importPath, importId, resolvedPath } of replacements) {
    //       // Create a clean import variable name
    //       const cleanImportVar = `import_${importId}`;

    //       // Replace the import statement with the resolved path
    //       processedCode = processedCode.replace(
    //         new RegExp(`import\\s+${importVar}\\s+from\\s+'${importPath}';`, 'g'),
    //         `import ${cleanImportVar} from '${resolvedPath}';`
    //       );

    //       // Replace all occurrences of the placeholder in the code
    //       processedCode = processedCode.replace(
    //         new RegExp(importVar, 'g'),
    //         cleanImportVar
    //       );
    //     }



    //     return prefix + processedCode;
    //   }
    // }
  };
}