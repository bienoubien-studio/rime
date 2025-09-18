import fs from 'node:fs';
import path from 'node:path';

const globPattern = async (pattern, options = {}) => {
	const dir = options.cwd || process.cwd();
	const files = fs.readdirSync(dir);
	// Simple pattern matching - for more complex patterns, use glob package
	if (pattern === '*.ts') {
		return files.filter((f) => f.endsWith('.ts'));
	}
	return files.filter((f) => f.match(pattern.replace('*', '.*')));
};

/**
 * Build script that scans $lib/config and generates
 * client/server configs in $lib/config/.generated
 */
export async function buildConfig() {
	const configDir = path.resolve('src/lib/config');
	const outputDir = path.join(configDir, '.generated');

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log('🔧 Building Rizom config...');

	// Scan for config files
	const rootConfig = await scanRootConfig(configDir);
	const collections = await scanCollections(configDir);
	const areas = await scanAreas(configDir);

	// Generate client configs
	await generateClientConfigs(outputDir, rootConfig, collections, areas);

	// Generate server configs
	await generateServerConfigs(outputDir, rootConfig, collections, areas);

	console.log('✅ Config generated successfully');
}

async function scanRootConfig(configDir) {
	const indexPath = path.join(configDir, 'index.ts');
	if (!fs.existsSync(indexPath)) return { client: {}, server: {} };

	const content = fs.readFileSync(indexPath, 'utf-8');
	const exports = extractExports(content);

	const config = { client: {}, server: {} };

	for (const [name, value] of Object.entries(exports)) {
		if (isServerOnlyProperty(name)) {
			config.server[name] = value;
		} else {
			config.client[name] = value;
		}
	}

	return config;
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
		const collection = await scanCollectionDir(collectionName, collectionPath);
		collections.push(collection);
	}

	return collections;
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
		const area = await scanAreaDir(areaName, areaPath);
		areas.push(area);
	}

	return areas;
}

async function scanCollectionDir(name, collectionPath) {
	const files = await globPattern('*.ts', { cwd: collectionPath });

	const collection = {
		name,
		clientProps: {},
		serverImports: [],
		clientImports: []
	};

	// Main index.ts file
	const indexPath = path.join(collectionPath, 'index.ts');
	if (fs.existsSync(indexPath)) {
		const content = fs.readFileSync(indexPath, 'utf-8');
		const exports = extractExports(content);
		const imports = extractImports(content);

		collection.clientImports = imports;

		for (const [exportName, exportValue] of Object.entries(exports)) {
			if (isServerOnlyProperty(exportName)) {
				// Skip server-only properties from index.ts - they should be in .server.ts files
				continue;
			}
			collection.clientProps[exportName] = exportValue;
		}
	}

	// Server-only files
	for (const file of files.filter((f) => f.endsWith('.server.ts'))) {
		const filePath = path.join(collectionPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const exports = extractExports(content);

		// If it's a simple export (like url.server.ts), add it directly
		if (Object.keys(exports).length > 0) {
			for (const [exportName, exportValue] of Object.entries(exports)) {
				// Add as server import with the export name
				const relativePath = `../collections/${name}/${file.replace('.ts', '.js')}`;
				collection.serverImports.push({
					file: exportName,
					path: relativePath
				});
			}
		} else {
			// Fallback to file-based import for complex server files
			const relativePath = `../collections/${name}/${file.replace('.ts', '.js')}`;
			collection.serverImports.push({
				file: file.replace('.server.ts', ''),
				path: relativePath
			});
		}
	}

	return collection;
}

async function scanAreaDir(name, areaPath) {
	const files = await globPattern('*.ts', { cwd: areaPath });

	const area = {
		name,
		clientProps: {},
		serverImports: [],
		clientImports: []
	};

	// Main index.ts file
	const indexPath = path.join(areaPath, 'index.ts');
	if (fs.existsSync(indexPath)) {
		const content = fs.readFileSync(indexPath, 'utf-8');
		const exports = extractExports(content);
		const imports = extractImports(content);

		area.clientImports = imports;

		for (const [exportName, exportValue] of Object.entries(exports)) {
			if (isServerOnlyProperty(exportName)) {
				continue;
			}
			area.clientProps[exportName] = exportValue;
		}
	}

	// Server-only files
	for (const file of files.filter((f) => f.endsWith('.server.ts'))) {
		const relativePath = `../areas/${name}/${file.replace('.ts', '.js')}`;
		area.serverImports.push({
			file: file.replace('.server.ts', ''),
			path: relativePath
		});
	}

	return area;
}

async function generateClientConfigs(outputDir, rootConfig, collections, areas) {
	// Generate individual collection files
	for (const collection of collections) {
		const content = generateCollectionClient(collection);
		fs.writeFileSync(path.join(outputDir, `${collection.name}.ts`), content);
	}

	// Generate individual area files
	for (const area of areas) {
		const content = generateAreaClient(area);
		fs.writeFileSync(path.join(outputDir, `${area.name}.ts`), content);
	}

	// Generate main client config
	const mainContent = generateMainClientConfig(rootConfig, collections, areas);
	fs.writeFileSync(path.join(outputDir, 'index.ts'), mainContent);
}

async function generateServerConfigs(outputDir, rootConfig, collections, areas) {
	// Generate individual collection files
	for (const collection of collections) {
		const content = generateCollectionServer(collection);
		fs.writeFileSync(path.join(outputDir, `${collection.name}.server.ts`), content);
	}

	// Generate individual area files
	for (const area of areas) {
		const content = generateAreaServer(area);
		fs.writeFileSync(path.join(outputDir, `${area.name}.server.ts`), content);
	}

	// Generate main server config
	const mainContent = generateMainServerConfig(rootConfig, collections, areas);
	fs.writeFileSync(path.join(outputDir, 'index.server.ts'), mainContent);
}

function generateCollectionClient(collection) {
	const props = Object.keys(collection.clientProps);
	const propsString = props.length > 0 ? props.join(',\n\t') : '';

	const imports = collection.clientImports || [];
	const importStatements = imports.map((imp) => `import ${imp.specifier} from '${imp.source}';`);

	// Combine all imports and deduplicate
	const allImports = [`import { collection } from '$rizom/core';`, ...importStatements];
	const uniqueImports = [...new Set(allImports)];

	return `/** auto-generated */
${uniqueImports.join('\n')}

${Object.entries(collection.clientProps)
	.map(([name, value]) => `export const ${name} = ${value};`)
	.join('\n')}

export default collection.config('${collection.name}', {
	${propsString}
});
`;
}

function generateCollectionServer(collection) {
	const serverImports = collection.serverImports.map((imp) => `import { ${imp.file} } from '${imp.path}';`);
	const clientImports = (collection.clientImports || []).map((imp) => `import ${imp.specifier} from '${imp.source}';`);

	const allProps = [...Object.keys(collection.clientProps), ...collection.serverImports.map((imp) => imp.file)];
	const propsString = allProps.length > 0 ? allProps.join(',\n\t') : '';

	// Combine all imports and deduplicate
	const allImports = [`import { collection } from '$rizom/core';`, ...clientImports, ...serverImports];
	const uniqueImports = [...new Set(allImports)];

	return `/** auto-generated */
${uniqueImports.join('\n')}

${Object.entries(collection.clientProps)
	.map(([name, value]) => `export const ${name} = ${value};`)
	.join('\n')}

export default collection.config('${collection.name}', {
	${propsString}
});
`;
}

function generateAreaClient(area) {
	const props = Object.keys(area.clientProps);
	const propsString = props.length > 0 ? props.join(',\n\t') : '';

	return `/** auto-generated */
import { area } from '$rizom/core';

${Object.entries(area.clientProps)
	.map(([name, value]) => `export const ${name} = ${value};`)
	.join('\n')}

export default area.config('${area.name}', {
	${propsString}
});
`;
}

function generateAreaServer(area) {
	const imports = area.serverImports.map((imp) => `import { ${imp.file} } from '${imp.path}';`).join('\n');

	const allProps = [...Object.keys(area.clientProps), ...area.serverImports.map((imp) => imp.file)];
	const propsString = allProps.length > 0 ? allProps.join(',\n\t') : '';

	return `/** auto-generated */
import { area } from '$rizom/core';
${imports}

${Object.entries(area.clientProps)
	.map(([name, value]) => `export const ${name} = ${value};`)
	.join('\n')}

export default area.config('${area.name}', {
	${propsString}
});
`;
}

function generateMainClientConfig(rootConfig, collections, areas) {
	const imports = [
		...collections.map((c) => `import ${c.name} from './${c.name}.js';`),
		...areas.map((a) => `import ${a.name} from './${a.name}.js';`)
	].join('\n');

	const clientProps = Object.entries(rootConfig.client)
		.map(([name, value]) => `\t${name}: ${value}`)
		.join(',\n');

	return `/** auto-generated */
import { buildConfig } from '$rizom/core';
${imports}

export default buildConfig({
${clientProps ? clientProps + ',\n' : ''}	collections: [${collections.map((c) => c.name).join(', ')}],
	areas: [${areas.map((a) => a.name).join(', ')}]
});
`;
}

function generateMainServerConfig(rootConfig, collections, areas) {
	const imports = [
		...collections.map((c) => `import ${c.name} from './${c.name}.server.js';`),
		...areas.map((a) => `import ${a.name} from './${a.name}.server.js';`)
	].join('\n');

	const allProps = [
		...Object.entries(rootConfig.server).map(([name, value]) => `\t${name}: ${value}`),
		...Object.entries(rootConfig.client).map(([name, value]) => `\t${name}: ${value}`)
	];
	const propsString = allProps.length > 0 ? allProps.join(',\n') : '';

	return `/** auto-generated */
import { buildConfig } from '$rizom/core';
${imports}

export default buildConfig({
${propsString ? propsString + ',\n' : ''}	collections: [${collections.map((c) => c.name).join(', ')}],
	areas: [${areas.map((a) => a.name).join(', ')}]
});
`;
}

function extractExports(content) {
	const exports = {};

	// Find all export const declarations with their full content
	const exportPattern =
		/export const (\w+) = ([^;]+(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^;]*)?(?:\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\][^;]*)?);/gs;

	let match;
	while ((match = exportPattern.exec(content)) !== null) {
		const [fullMatch, name, value] = match;
		exports[name] = value.trim();
	}

	// If the complex regex doesn't work, fallback to simpler line-by-line approach
	if (Object.keys(exports).length === 0) {
		const lines = content.split('\n');
		let currentExport = null;
		let currentValue = '';
		let braceCount = 0;
		let bracketCount = 0;
		let parenCount = 0;
		let inString = false;
		let stringChar = '';

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check for start of export
			const exportMatch = line.match(/^export const (\w+) = (.*)$/);
			if (exportMatch && !currentExport) {
				const [, name, value] = exportMatch;
				currentExport = name;
				currentValue = value;

				// Check if this is a complete single-line export
				if (value.endsWith(';') && !value.includes('(') && !value.includes('{') && !value.includes('[')) {
					exports[name] = value.slice(0, -1);
					currentExport = null;
					currentValue = '';
					continue;
				}
			} else if (currentExport) {
				currentValue += '\n' + line;
			}

			// Count brackets and braces to find end of multiline exports
			if (currentExport) {
				for (const char of line) {
					if (!inString) {
						if (char === '"' || char === "'" || char === '`') {
							inString = true;
							stringChar = char;
						} else if (char === '{') braceCount++;
						else if (char === '}') braceCount--;
						else if (char === '[') bracketCount++;
						else if (char === ']') bracketCount--;
						else if (char === '(') parenCount++;
						else if (char === ')') parenCount--;
					} else if (char === stringChar && line[line.indexOf(char) - 1] !== '\\') {
						inString = false;
						stringChar = '';
					}
				}

				// Check if export is complete
				if (line.includes(';') && braceCount === 0 && bracketCount === 0 && parenCount === 0 && !inString) {
					// Remove trailing semicolon
					if (currentValue.endsWith(';')) {
						currentValue = currentValue.slice(0, -1);
					}
					exports[currentExport] = currentValue;
					currentExport = null;
					currentValue = '';
					braceCount = 0;
					bracketCount = 0;
					parenCount = 0;
				}
			}
		}
	}

	return exports;
}

function extractImports(content) {
	const imports = [];
	const importPattern = /import\s+(.+?)\s+from\s+['"](.*?)['"];/g;

	let match;
	while ((match = importPattern.exec(content)) !== null) {
		const [fullMatch, specifier, source] = match;
		imports.push({
			specifier: specifier.trim(),
			source: source.trim(),
			fullMatch
		});
	}

	return imports;
}

function isServerOnlyProperty(name) {
	const serverOnlyProps = ['database', 'smtp', 'trustedOrigins', 'cache', 'routes', 'plugins', 'hooks', 'url', 'auth'];
	return serverOnlyProps.includes(name);
}

// Run the build if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	buildConfig().catch(console.error);
}
