import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';
import type { NumberField } from '../index.js';

export type NumberFieldProps = { path: string; config: NumberField; form: DocumentFormContext };
