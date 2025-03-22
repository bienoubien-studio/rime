import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
import type { TextField } from '../index.js';
import type { FormContext } from 'rizom/panel/context/form.svelte.js';
import type { Component } from 'svelte';
import type { IconProps } from '@lucide/svelte';

export type TextFieldProps = {
	path?: string;
	config: TextField;
	type?: 'text' | 'password';
	icon?: Component<IconProps>
	form: DocumentFormContext | FormContext;
};
