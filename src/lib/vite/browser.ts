import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { logger } from '../util/logger';
import { clearLog, logToFile } from '../../log';

// Virtual module ID
const VIRTUAL_MODULE_ID = 'virtual:browser-config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const GENERATED_CONFIG_PATH = path.join(process.cwd(), '.rizom', 'config.browser.txt');


export function rizomClient(): Plugin {
  return {
    name: 'rizom:browser-config',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    /**
     * Load the virtual browser config file
     */
    async load(id) {
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
          logger.error('Error loading browser config:', error);
          return 'export default {}';
        }
      }
    },

    /**
     * Invalidate virtual browser config 
     * when the generated one changes
     */
    configureServer(server) {
      server.watcher.add('src/lib/rizom.config.browser.js');
      server.watcher.on('change', async (path) => {
        if (path.includes('rizom.config.browser')) {
          const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (module) {
            server.moduleGraph.invalidateModule(module);
            logger.info('Browser config invalidated');
          }
        }
      })
    },

    /**
     * Transform the config to replace await imports with string notation
     * transform back on browser config to classic imports and replace with variables
     */
    transform(code, id) {
      // Transform the config to replace await imports with string notation
      if (id.includes('src/config/rizom.config')) {
        // Regular expression to find only the await import pattern
        const importRegex = /\(await\s+import\(['"](.+?)['"]\)\)\.(\w+)/g;

        // Process the code and replace import expressions
        let processedCode = code;
        let match;

        while ((match = importRegex.exec(code)) !== null) {
          const [fullMatch, modulePath, propertyName] = match;

          // Resolve the module path relative to the project root
          const resolvedPath = modulePath.startsWith('./') || modulePath.startsWith('../')
            ? './' + path.join('src', 'config', modulePath)
            : modulePath;

          // Replace with string notation: path@property
          processedCode = processedCode.replace(fullMatch, `'__from_await__:${resolvedPath}@${propertyName}'`);
        }

        return processedCode;
      }

      // Transform back on virtual browser config to classic imports and replace with variables
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        clearLog()
        logToFile('input', code)
        // Regular expression to find the specific string notation pattern with our prefix
        const stringNotationRegex = /['|"]__from_await__:([^']+?)@(\w+)['|"]/g;

        // Store all imports and variable mappings
        const imports = new Map();
        const replacements = new Map();

        // First pass: collect all imports and create variable mappings
        let match;
        while ((match = stringNotationRegex.exec(code)) !== null) {
          const [fullMatch, modulePath, propertyName] = match;

          // Convert module name to a valid variable name (kebab-case to camelCase)
          const moduleBaseName = path.basename(modulePath, path.extname(modulePath));
          let baseVarName = propertyName === 'default'
            ? moduleBaseName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
            : propertyName;

          // Format with the special prefix/suffix to prevent conflicts
          const variableName = `__from_await_${baseVarName}__`;

          // Create import statement based on property name
          let importStatement;
          if (propertyName === 'default') {
            importStatement = `import ${variableName} from '${modulePath}';`;
          } else {
            importStatement = `import { ${propertyName} as ${variableName} } from '${modulePath}';`;
          }

          // Add to imports map if not already present
          if (!imports.has(importStatement)) {
            imports.set(importStatement, variableName);
          }

          // Store the replacement mapping
          replacements.set(fullMatch, variableName);
        }

        // Second pass: replace all occurrences in the code
        let processedCode = code;
        for (const [pattern, replacement] of replacements.entries()) {
          // Escape special regex characters in the pattern
          const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Create a global regex for replacement
          const regex = new RegExp(escapedPattern, 'g');
          // Replace all occurrences
          processedCode = processedCode.replace(regex, replacement);
        }

        // Combine all imports with the processed code
        const importStatements = Array.from(imports.keys()).join('\n');
        processedCode = importStatements ? `${importStatements}\n\n${processedCode}` : processedCode;
        logToFile('output', processedCode)
        return processedCode
      }

      return code;
    }
  };
}