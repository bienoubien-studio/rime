import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { TreeFieldRaw } from '..';
import type { TreeBlock } from 'rizom/types/doc';
import type { Dic } from 'rizom/types/utility';

export type TreeBlockProps = {
	path: string;
	sorting: boolean;
	treeState: {
		addItem: (emptyValues: Dic) => void;
		moveItem: (fromPath: string, toPath: string) => void;
		deleteItem: (path: string, index: number) => void;
		duplicateItem: (path: string, index: number) => void;
		readonly stamp: string;
		readonly items: TreeBlock[];
	};
	form: DocumentFormContext;
	config: TreeFieldRaw;
	treeKey: string;
};
