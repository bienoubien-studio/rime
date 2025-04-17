import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
import type { TreeFieldRaw } from '../index.js';

export type TreeProps = {
	path: string;
	config: TreeFieldRaw;
	form: DocumentFormContext;
};
