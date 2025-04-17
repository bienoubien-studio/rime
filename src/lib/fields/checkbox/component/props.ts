import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
import type { CheckboxField } from '../index.js';

export type CheckboxProps = { path: string; config: CheckboxField; form: DocumentFormContext };
