<script lang="ts">
	import { Checkbox } from '$lib/panel/components/ui/checkbox/index.js';
	import { slugify } from '$lib/util/string.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { CheckboxProps } from './props';

	const { path, config, form }: CheckboxProps = $props();

	const field = $derived(form.useField(path, config));

	const onCheckedChange = (bool: boolean | string) => {
		field.value = bool;
	};

	const checkboxErrorClass = $derived(field.error ? 'rz-checkbox--error' : '');
	const inputId = `${form.key}-${slugify(path)}`;
</script>

<fieldset class="rz-checkbox-field {config.className || ''}" use:root={field}>
	<Checkbox
		class="rz-checkbox-field__input {checkboxErrorClass}"
		checked={field.value}
		{onCheckedChange}
		id={inputId}
	/>
	<Field.LabelFor {config} for={inputId} />
</fieldset>

<style lang="postcss">
	.rz-checkbox-field {
		display: flex;
		align-items: center;
		gap: var(--rz-size-2);
		margin-top: var(--rz-size-3);
		margin-bottom: var(--rz-size-3);
	}

	.rz-checkbox-field__input {
		width: var(--rz-size-5);
		height: var(--rz-size-5);
	}

	.rz-checkbox--error {
		@mixin bg color-error;
	}
</style>
