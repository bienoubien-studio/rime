import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { BlocksFieldRaw } from '../index.js';

export type BlocksProps = {
	path: string;
	config: BlocksFieldRaw;
	form: DocumentFormContext;
};
