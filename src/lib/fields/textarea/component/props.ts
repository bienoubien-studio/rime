import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { TextAreaField } from '../index.js';
import type { FormContext } from 'rizom/panel/context/form.svelte.js';

export type TextAreaFieldProps = {
	path?: string;
	config: TextAreaField;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
};
