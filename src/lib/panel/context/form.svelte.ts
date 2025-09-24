import { diff } from 'deep-object-diff';
import type { SubmitFunction } from '@sveltejs/kit';
import { applyAction } from '$app/forms';
import { getContext, setContext } from 'svelte';
import { setErrorsContext } from './errors.svelte';
import type { FormField } from '$lib/fields/types.js';
import type { Dic } from '$lib/util/types.js';
import type { ClientField } from '$lib/fields/types.js';

function createFormStore(initial: Dic, key: string) {
	//
	const errors = setErrorsContext(key);

	let form = $state(initial);
	const changes = $derived<Dic>(diff(initial, form));
	const hasError = $derived(errors.length);
	const canSubmit = $derived(Object.keys(changes).length > 0 && !hasError);
	let status = $state<number>();

	$effect(() => {
		if (Object.keys(changes).length) {
			errors.value = {};
		}
	});

	function setValue(path: string, value: any) {
		status = undefined;
		form = { ...form, [path]: value };
	}

	function useField(path: string | undefined, config: ClientField<FormField>) {
		path = path || config.name;
		//
		const validate = (value: any) => {
			let isEmpty;
			try {
				isEmpty = config.isEmpty(value);
			} catch (err: any) {
				console.error(err.message);
				throw new Error(config.type + ' ' + err.message);
			}
			if (config.required && isEmpty) {
				errors.value[path] = 'required::required_field';
				return false;
			}

			if (config.validate) {
				const validated = config.validate(value, {
					data: form,
					id: undefined,
					operation: undefined,
					user: undefined,
					locale: undefined,
					config
				});

				if (validated !== true) {
					errors.value[path] = validated;
					return false;
				}
			}
			if (errors.has(path)) {
				errors.delete(path);
			}

			return true;
		};

		return {
			path,

			get value() {
				return form[path];
			},

			get editable() {
				return true;
			},

			set value(value: any) {
				const valid = validate(value);

				if (valid) {
					setValue(path, value);
				}
			},

			get visible() {
				return config.condition ? config.condition(form, {}) : true;
			},

			get error() {
				return errors.value[path] || false;
			}
		};
	}

	const enhance: SubmitFunction = async ({ formData }) => {
		for (const key of Object.keys(form)) {
			formData.set(key, form[key]);
		}

		return async ({ result }) => {
			status = result.status;

			switch (result.type) {
				case 'failure':
					if (result.data?.errors) {
						errors.value = result.data.errors;
					}
					if (result.data?.error) {
						errors.value = result.data.errors;
					}
					form = result.data?.form || {};
					initial = form;
					break;
				case 'redirect':
					await applyAction(result);
					break;
			}
		};
	};

	return {
		setValue,
		useField,
		readOnly: false,
		enhance,

		get canSubmit() {
			return canSubmit;
		},

		get errors() {
			return errors;
		},

		get error() {
			return errors;
		},

		get form() {
			return form;
		},

		get changes() {
			return changes;
		},

		get status() {
			return status;
		}
	};
}

export function setFormContext(initial: Dic, key: string) {
	const store = createFormStore(initial, key);
	return setContext(key, store);
}

export function getFormContext(key: string) {
	return getContext<FormContext>(key);
}

export type FormContext = ReturnType<typeof setFormContext>;
