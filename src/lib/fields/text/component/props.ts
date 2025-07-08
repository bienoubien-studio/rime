import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
import type { TextField } from '../index.server.js';
import type { FormContext } from '$lib/panel/context/form.svelte.js';
import type { Component } from 'svelte';
import type { IconProps } from '@lucide/svelte';
import type { ClientField } from '$lib/fields/types.js';

export type TextFieldProps = {
	path?: string;
	config: ClientField<TextField>;
	type?: 'text' | 'password';
	icon?: Component<IconProps>;
	form: DocumentFormContext | FormContext;
};
