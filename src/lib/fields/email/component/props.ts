import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { EmailField } from '../index.server.js';
import type { FormContext } from '$lib/panel/context/form.svelte.js';
import type { ClientField } from '$lib/fields/types.js';

export interface EmailFieldProps {
	path?: string;
	config: ClientField<EmailField>;
	type?: 'text' | 'password';
	form: DocumentFormContext | FormContext;
}
