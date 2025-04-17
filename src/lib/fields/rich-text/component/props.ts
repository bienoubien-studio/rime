import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { RichTextField } from '../index';

export type RichTextFieldProps = {
	class?: string;
	path: string;
	standAlone?: boolean;
	config: RichTextField;
	form: DocumentFormContext;
};
