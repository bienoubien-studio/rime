import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { RichTextField } from '../index';

export type RichTextFieldProps = {
	class?: string;
	path: string;
	config: RichTextField;
	form: DocumentFormContext;
};
