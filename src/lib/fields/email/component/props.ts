import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { EmailField } from '../index.js';
import type { FormContext } from '$lib/panel/context/form.svelte.js';

export interface EmailFieldProps {
	path?: string;
	config: EmailField;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
}
