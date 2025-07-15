/**
 * Normalizes pnpm paths to simpler paths that work better with module resolution
 */
export function normalizePnpmPath(importPath: string): string {
	// Check if this is a pnpm path
	if (importPath.includes('node_modules/.pnpm/')) {
		// Extract the package name and the rest of the path
		const pnpmPattern = /node_modules\/\.pnpm\/([^/]+).*?\/node_modules\/([^/]+)(.*)/;
		const match = importPath.match(pnpmPattern);

		if (match) {
			// match[2] is the package name
			// match[3] is the rest of the path after the package name
			return `node_modules/${match[2]}${match[3]}`;
		}
	}

	// Return the original path if it's not a pnpm path or if we couldn't normalize it
	return importPath;
}

export function normalizeFilePath(importPath: string) {
	if (importPath.startsWith('file://')) {
		importPath = importPath.replace('file://', '');
	}
	importPath = importPath.replace(process.cwd(), '');
	return importPath;
}

export function normalizeRizomImport(importPath: string): string {
	if (importPath.includes('node_modules/@rizom')) {
		// Replace node_modules/@rizom/anything/dist/ with @rizom/anything/
		importPath = importPath.replace(/node_modules\/@rizom\/(.+?)\/dist\/(.+)$/, '@rizom/$1/$2');
	} else if (importPath.includes('node_modules/rizom')) {
		// Replace node_modules/rizom/dist/ with rizom/
		importPath = importPath.replace(/node_modules\/rizom\/dist\/(.+)$/, 'rizom/$1');
	}
	return importPath;
}

export function removeLeadingSlash(importPath: string) {
	if (importPath.startsWith('/')) {
		importPath = importPath.substring(1);
	}
	return importPath;
}
