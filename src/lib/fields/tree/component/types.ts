import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { Field } from 'rizom/types';
import type { TreeFieldRaw } from '..';

export type TreeBlockProps = {
	fields: Field[];
	path: string;
	sorting: boolean;
	deleteBlock?: () => void;
	duplicateBlock?: () => void;
	form: DocumentFormContext;
	config: TreeFieldRaw;
	treeKey: string;
};
