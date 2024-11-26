<script lang="ts">
	import { Checkbox } from '$lib/panel/components/ui/checkbox/index.js';
	import { slugify } from '$lib/utils/string.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { Field } from '../index';
	import type { CheckboxField } from 'rizom/types/fields';
	import './checkbox.css';

	type Props = { path: string; config: CheckboxField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	const field = $derived(form.useField(path, config));

	const onCheckedChange = (bool: boolean | string) => {
		field.value = bool;
	};

	const checkboxErrorClass = $derived(field.error ? 'rz-checkbox--error' : '');
</script>

<Field.Root visible={field.visible} disabled={form.readOnly} class="rz-checkbox-field">
	<Checkbox
		class="rz-checkbox-field__input {checkboxErrorClass}"
		checked={field.value}
		{onCheckedChange}
		id={slugify(config.name)}
	/>
	<Field.LabelFor {config} />
</Field.Root>
