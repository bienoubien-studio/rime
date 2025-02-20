import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { TreeFieldRaw } from '../index.js';

export type TreeProps = {
	path: string;
	config: TreeFieldRaw;
	form: DocumentFormContext;
};
