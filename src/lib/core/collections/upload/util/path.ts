import { PARAMS, UPLOAD_PATH } from '$lib/core/constant.js';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { Route } from '$lib/panel/types.js';
import type { WithRequired } from '$lib/util/types.js';
import { uploadPath as validatePath } from '$lib/util/validate.js';

export type UploadPath = `${typeof UPLOAD_PATH.ROOT_NAME}${string}`;
type Aria = WithRequired<Partial<Route>, 'title'>;

/**
 * Validates that a path string follows the required format:
 * - Must start with ROOT_NAME
 * - Only allows alphanumeric characters, hyphens, underscores, spaces, and the separator
 * - Can only use the defined separator
 * @example
 * validatePath("root:folder:subfolder") // valid
 * validatePath("root:folder with spaces:sub-folder_name") // valid
 * validatePath("root/folder") // throws Error
 * validatePath("root:folder$") // throws Error
 */

/**
 * Given an optional path string
 * this returns:
 * - the name (last part of the segment)
 * - the parent path (path without the name)
 * - the normalized path
 * @example
 * getSegments("root:foo:bar") // { name: "bar", parent: "root:foo", path: "root:foo:bar" }
 * getSegments("root") // { name: "root", parent: null, path: "root" }
 */
export function getSegments(path?: UploadPath | null): {
	name: string;
	path: UploadPath;
	parent: UploadPath | null;
} {
	// Use nullish coalescing to handle both undefined and null
	const safePath = path ?? UPLOAD_PATH.ROOT_NAME;

	// Validate and normalize the path
	const isValid = validatePath(safePath);
	if (typeof isValid === 'string') {
		throw Error(isValid);
	}

	const segments = safePath.split(UPLOAD_PATH.SEPARATOR);

	if (segments.length <= 1) {
		return {
			name: UPLOAD_PATH.ROOT_NAME,
			path: UPLOAD_PATH.ROOT_NAME,
			parent: null
		};
	}

	const name = segments[segments.length - 1];
	// Only create parent if we have more than one segment
	const parent = segments.length > 1 ? segments.slice(0, -1).join(UPLOAD_PATH.SEPARATOR) : null;

	return {
		name,
		parent: parent as UploadPath,
		path: safePath
	};
}

/**
 * Get the parent path for a given path
 * or return null if path is ROOT_NAME
 * @example
 * // returns 'root'
 * getParentPath('root:foo')
 */
export function getParentPath(path: UploadPath) {
	if (path === UPLOAD_PATH.ROOT_NAME) return null;
	return path.split(UPLOAD_PATH.SEPARATOR).slice(0, -1).join(UPLOAD_PATH.SEPARATOR);
}

/**
 * Build an array of route based on the path param
 * for a given collection slug. 
 * This omiting the root path wich is the collection path and do not add the path to the last
 * @example 
 * buildUploadAria('root:foo')
 * // return [{ title: 'foo' }]
 * buildUploadAria('root:foo:bar')
 * // return [{ title: 'foo', path: '/panel/{slug}?=root:foo' }, { title: 'bar' }]
 */
export function buildUploadAria({
	path,
	slug
}: {
	path: UploadPath;
	slug: CollectionSlug;
}): WithRequired<Partial<Route>, 'title'>[] {
	const segments = path.split(':');
	const result: Aria[] = [];
	let currentPath = '';
	
	for (const segment of segments) {
		if (!segment) continue;
		currentPath = currentPath ? `${currentPath}:${segment}` : segment;
		if (currentPath !== segments[0]) {
			result.push({
				title: segment,
				path: `/panel/${slug}?${PARAMS.UPLOAD_PATH}=${currentPath}`
			});
			
		}
	}

	return result;
}


export function removePathFromLastAria(aria:WithRequired<Partial<Route>, 'title'>[] ){
	return aria.map((route, index) => {
		if(index === aria.length - 1){
			return { title: route.title }
		}
		return route
	})
}