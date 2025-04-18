import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { TreeFieldRaw } from '../index.js';
import type { TreeBlock } from '$lib/types/doc';
import type { Dic } from '$lib/types/util';

export type TreeBlockProps = {
	path: string;
	sorting: boolean;
	treeState: {
		addItem: (emptyValues: Dic) => void;
		moveItem: (fromPath: string, toPath: string) => void;
		deleteItem: (path: string, index: number) => void;
		readonly path: string;
		readonly stamp: string;
		readonly items: TreeBlock[];
	};
	form: DocumentFormContext;
	config: TreeFieldRaw;
	treeKey: string;
};
