import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { BlocksField } from '../index.js';

export type BlocksProps = {
	path: string;
	config: BlocksField;
	form: DocumentFormContext;
};
