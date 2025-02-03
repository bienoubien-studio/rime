import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { RawBlocksField } from '../index.js';

export type BlocksProps = {
	path: string;
	config: RawBlocksField;
	form: DocumentFormContext;
};
