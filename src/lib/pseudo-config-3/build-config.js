import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Build script that scans source config files and generates
 * client/server configs in .rizom directory
 */
export async function buildConfig() {
	const rootDir = process.cwd();
	const configDir = path.join(rootDir, 'src/lib/config');
	const outputDir = path.join(rootDir, 'src/lib/.rizom');

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Scan for config files
	const rootConfig = await scanRootConfig(configDir);
	const collections = await scanCollections(configDir);
	const areas = await scanAreas(configDir);

	// Generate client config
	await generateClientConfig(outputDir, rootConfig, collections, areas);

	// Generate server config
	await generateServerConfig(outputDir, rootConfig, collections, areas);

	console.log('✅ Config generated successfully');
}

async function scanRootConfig(configDir) {
	const indexPath = path.join(configDir, 'index.ts');
	if (!fs.existsSync(indexPath)) return {};

	const content = fs.readFileSync(indexPath, 'utf-8');

	// Extract exports (simplified - in real implementation would use AST)
	const exports = {};
	const exportMatches = content.matchAll(/export const (\w+) = ([^;]+);/g);

	for (const [, name, value] of exportMatches) {
		if (isServerOnlyProperty(name)) {
			exports.server = exports.server || {};
			exports.server[name] = value;
		} else {
			exports.client = exports.client || {};
			exports.client[name] = value;
		}
	}

	return exports;
}

async function scanCollections(configDir) {
	const collectionsDir = path.join(configDir, 'collections');
	if (!fs.existsSync(collectionsDir)) return [];

	const collectionDirs = fs
		.readdirSync(collectionsDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	const collections = [];

	for (const collectionName of collectionDirs) {
		const collectionPath = path.join(collectionsDir, collectionName);
		const collection = await scanCollection(collectionName, collectionPath);
		collections.push(collection);
	}

	return collections;
}

async function scanCollection(name, collectionPath) {
	const files = await glob('**/*.ts', { cwd: collectionPath });

	const collection = {
		name,
		client: {},
		server: {}
	};

	for (const file of files) {
		const filePath = path.join(collectionPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');

		if (file.endsWith('.server.ts')) {
			// Server-only file
			collection.server[file] = {
				path: filePath,
				content,
				exports: extractExports(content)
			};
		} else {
			// Client-safe file
			const exports = extractExports(content);
			collection.client[file] = {
				path: filePath,
				content,
				exports: filterClientSafeExports(exports)
			};

			// Also include in server config
			collection.server[file] = {
				path: filePath,
				content,
				exports
			};
		}
	}

	return collection;
}

async function scanAreas(configDir) {
	const areasDir = path.join(configDir, 'areas');
	if (!fs.existsSync(areasDir)) return [];

	const areaDirs = fs
		.readdirSync(areasDir, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	const areas = [];

	for (const areaName of areaDirs) {
		const areaPath = path.join(areasDir, areaName);
		const area = await scanArea(areaName, areaPath);
		areas.push(area);
	}

	return areas;
}

async function scanArea(name, areaPath) {
	// Similar to scanCollection but for areas
	const files = await glob('**/*.ts', { cwd: areaPath });

	const area = {
		name,
		client: {},
		server: {}
	};

	for (const file of files) {
		const filePath = path.join(areaPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');

		if (file.endsWith('.server.ts')) {
			area.server[file] = {
				path: filePath,
				content,
				exports: extractExports(content)
			};
		} else {
			const exports = extractExports(content);
			area.client[file] = {
				path: filePath,
				content,
				exports: filterClientSafeExports(exports)
			};

			area.server[file] = {
				path: filePath,
				content,
				exports
			};
		}
	}

	return area;
}

async function generateClientConfig(outputDir, rootConfig, collections, areas) {
	// Generate individual collection/area files
	for (const collection of collections) {
		const clientContent = generateCollectionClient(collection);
		fs.writeFileSync(path.join(outputDir, `${collection.name}.ts`), clientContent);
	}

	for (const area of areas) {
		const clientContent = generateAreaClient(area);
		fs.writeFileSync(path.join(outputDir, `${area.name}.ts`), clientContent);
	}

	// Generate main client config
	const mainClientConfig = `
import { defineConfig } from '$rizom/config';
${collections.map((c) => `import ${c.name} from './${c.name}.js';`).join('\n')}
${areas.map((a) => `import ${a.name} from './${a.name}.js';`).join('\n')}

/** auto-generated */
export default defineConfig({
	${
		rootConfig.client
			? Object.keys(rootConfig.client)
					.map((key) => `${key}: ${rootConfig.client[key]}`)
					.join(',\n\t') + ','
			: ''
	}
	collections: [${collections.map((c) => c.name).join(', ')}],
	areas: [${areas.map((a) => a.name).join(', ')}]
});
`;

	fs.writeFileSync(path.join(outputDir, 'index.ts'), mainClientConfig);
}

async function generateServerConfig(outputDir, rootConfig, collections, areas) {
	// Generate individual collection/area files
	for (const collection of collections) {
		const serverContent = generateCollectionServer(collection);
		fs.writeFileSync(path.join(outputDir, `${collection.name}.server.ts`), serverContent);
	}

	for (const area of areas) {
		const serverContent = generateAreaServer(area);
		fs.writeFileSync(path.join(outputDir, `${area.name}.server.ts`), serverContent);
	}

	// Generate main server config
	const mainServerConfig = `
import { defineConfig } from '$rizom/config';
${collections.map((c) => `import ${c.name} from './${c.name}.server.js';`).join('\n')}
${areas.map((a) => `import ${a.name} from './${a.name}.server.js';`).join('\n')}

/** auto-generated */
export default defineConfig({
	${
		rootConfig.server
			? Object.keys(rootConfig.server)
					.map((key) => `${key}: ${rootConfig.server[key]}`)
					.join(',\n\t') + ','
			: ''
	}
	${
		rootConfig.client
			? Object.keys(rootConfig.client)
					.map((key) => `${key}: ${rootConfig.client[key]}`)
					.join(',\n\t') + ','
			: ''
	}
	collections: [${collections.map((c) => c.name).join(', ')}],
	areas: [${areas.map((a) => a.name).join(', ')}]
});
`;

	fs.writeFileSync(path.join(outputDir, 'index.server.ts'), mainServerConfig);
}

function generateCollectionClient(collection) {
	// Generate client-safe collection file
	return `/** auto-generated */
import { collection } from '$lib/core/collections/config/builder.js';
${generateImports(collection.client)}

${generateClientExports(collection.client)}

// Client collection - server-only properties excluded
export default collection('${collection.name}', {
	${generateClientCollectionProperties(collection.client)}
});
`;
}

function generateCollectionServer(collection) {
	// Generate full server collection file
	return `/** auto-generated */
import { collection } from '$lib/core/collections/config/builder.js';
${generateImports(collection.server)}

${generateServerExports(collection.server)}

// Full server collection with all properties
export default collection('${collection.name}', {
	${generateServerCollectionProperties(collection.server)}
});
`;
}

function generateAreaClient(area) {
	return `/** auto-generated */
import { area } from '$lib/core/areas/config/builder.js';
${generateImports(area.client)}

${generateClientExports(area.client)}

// Client area - server-only properties excluded
export default area('${area.name}', {
	${generateClientAreaProperties(area.client)}
});
`;
}

function generateAreaServer(area) {
	return `/** auto-generated */
import { area } from '$lib/core/areas/config/builder.js';
${generateImports(area.server)}

${generateServerExports(area.server)}

// Full server area with all properties
export default area('${area.name}', {
	${generateServerAreaProperties(area.server)}
});
`;
}

function extractExports(content) {
	// Simplified export extraction - in real implementation use AST
	const exports = {};
	const exportMatches = content.matchAll(/export const (\w+) = ([^;]+);/g);

	for (const [, name, value] of exportMatches) {
		exports[name] = value;
	}

	return exports;
}

function filterClientSafeExports(exports) {
	const clientSafe = {};
	for (const [name, value] of Object.entries(exports)) {
		if (!isServerOnlyProperty(name)) {
			clientSafe[name] = value;
		}
	}
	return clientSafe;
}

function isServerOnlyProperty(name) {
	const serverOnlyProps = [
		'database',
		'smtp',
		'trustedOrigins',
		'cache',
		'routes',
		'plugins',
		'hooks',
		'access',
		'url',
		'auth'
	];
	return serverOnlyProps.includes(name);
}

function generateImports(files) {
	// Generate import statements based on file dependencies
	// This is simplified - real implementation would analyze dependencies
	return `// Auto-generated imports`;
}

function generateClientExports(files) {
	let exports = '';
	for (const [filename, fileData] of Object.entries(files)) {
		for (const [exportName, exportValue] of Object.entries(fileData.exports)) {
			if (!isServerOnlyProperty(exportName)) {
				exports += `export const ${exportName} = ${exportValue};\n`;
			}
		}
	}
	return exports;
}

function generateServerExports(files) {
	let exports = '';
	for (const [filename, fileData] of Object.entries(files)) {
		for (const [exportName, exportValue] of Object.entries(fileData.exports)) {
			exports += `export const ${exportName} = ${exportValue};\n`;
		}
	}
	return exports;
}

function generateClientCollectionProperties(files) {
	// Generate object properties for client collection
	const props = [];
	for (const [filename, fileData] of Object.entries(files)) {
		for (const [exportName] of Object.entries(fileData.exports)) {
			if (!isServerOnlyProperty(exportName)) {
				props.push(exportName);
			}
		}
	}
	return props.join(',\n\t');
}

function generateServerCollectionProperties(files) {
	// Generate object properties for server collection
	const props = [];
	for (const [filename, fileData] of Object.entries(files)) {
		for (const [exportName] of Object.entries(fileData.exports)) {
			props.push(exportName);
		}
	}
	return props.join(',\n\t');
}

function generateClientAreaProperties(files) {
	return generateClientCollectionProperties(files);
}

function generateServerAreaProperties(files) {
	return generateServerCollectionProperties(files);
}

// Run the build
if (import.meta.url === `file://${process.argv[1]}`) {
	buildConfig().catch(console.error);
}
