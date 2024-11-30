import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { TextField } from '../index.js';
import type { FormContext } from 'rizom/panel/context/form.svelte.js';

export type TextFieldProps = {
	path?: string;
	config: TextField;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
};
