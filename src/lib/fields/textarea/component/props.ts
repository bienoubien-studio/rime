import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { TextAreaField } from '../index.js';
import type { FormContext } from '$lib/panel/context/form.svelte.js';

export type TextAreaFieldProps = {
	path?: string;
	config: TextAreaField;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
};
