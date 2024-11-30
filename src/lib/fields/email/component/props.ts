import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { EmailField } from '../index.js';
import type { FormContext } from 'rizom/panel/context/form.svelte.js';

export interface EmailFieldProps {
	path?: string;
	config: EmailField;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
}
