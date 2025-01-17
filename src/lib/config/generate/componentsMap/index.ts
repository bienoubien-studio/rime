import fs from 'fs';
import path from 'path';
import { taskLogger } from 'rizom/utils/logger/index.js';
import type { FieldsComponents } from 'rizom/types/panel';
import { PACKAGE_NAME } from 'rizom/constant';

function getSymbolFilename(value: any): string | null {
	const symbols = Object.getOwnPropertySymbols(value);
	const filenameSymbol = symbols.find((sym) => sym.description === 'filename');
	if (filenameSymbol) {
		return value[filenameSymbol];
	}
	return null;
}

function createImportStatement(component: any): string {
	if (typeof component !== 'function') return 'null';

	const filename = getSymbolFilename(component);
	if (!filename) return 'null';

	if (filename.match(/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/)) {
		return filename.replace(
			/rizom\/dist\/fields\/(.+?)\/component\/(.+?)\.svelte/,
			`await import('${PACKAGE_NAME}/fields/components').then(m => m.$2)`
		);
	}
	if (filename.includes('node_modules')) {
		const modulePath = filename.split('node_modules/').pop() ?? '';
		return `await import('${modulePath.replace('dist/', '').replace('.svelte', '')}').then(m => m.default)`;
	}
	if (filename.endsWith('.svelte')) {
		const componentPath = filename.split('src/').pop() ?? '';
		return `await import('../${componentPath}').then(m => m.default)`;
	}
	return 'null';
}

const generateComponentsMap = (fieldsComponentsMap: Record<string, FieldsComponents>) => {
	const componentsEntries: string[] = [];

	Object.entries(fieldsComponentsMap).forEach(([type, { component, cell }]) => {
		const componentImport = createImportStatement(component);
		const cellImport = cell ? createImportStatement(cell) : 'null';

		componentsEntries.push(`  "${type}": {
    component: ${componentImport},
    cell: ${cellImport}
  }`);
	});

	const content = `// Auto-generated file, do not edit
import type { FieldsComponents } from 'rizom/types/panel';

export const fieldsComponentsMap: Record<string, FieldsComponents> = {
${componentsEntries.join(',\n')}
};`;

	const componentsMapPath = path.resolve(process.cwd(), './src/lib/rizom.components.ts');
	fs.writeFileSync(componentsMapPath, content);
	taskLogger.done('Components map generated');
};

export default generateComponentsMap;
