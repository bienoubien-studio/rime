<script lang="ts">
	import { Checkbox } from '$lib/panel/components/ui/checkbox/index.js';
	import { slugify } from '$lib/util/string.js';
	import { Field } from 'rizom/panel';
	import './checkbox.css';
	import type { CheckboxProps } from './props';

	const { path, config, form }: CheckboxProps = $props();

	const field = $derived(form.useField(path, config));

	const onCheckedChange = (bool: boolean | string) => {
		field.value = bool;
	};

	const checkboxErrorClass = $derived(field.error ? 'rz-checkbox--error' : '');
</script>

<Field.Root
	visible={field.visible}
	disabled={!field.editable}
	class="rz-checkbox-field {config.className || ''}"
>
	<Checkbox
		class="rz-checkbox-field__input {checkboxErrorClass}"
		checked={field.value}
		{onCheckedChange}
		id={slugify(config.name)}
	/>
	<Field.LabelFor {config} />
</Field.Root>
