import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { ComboBoxField } from '../index.js';

export type ComboBoxProps = {
	path: string;
	config: ComboBoxField;
	form: DocumentFormContext;
};
