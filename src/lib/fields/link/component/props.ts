import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte.js';
import type { LinkField } from '../index.js';

export type LinkFieldProps = {
	path?: string;
	config: LinkField;
	form: DocumentFormContext;
};
