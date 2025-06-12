<script lang="ts">
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import type { ToggleProps } from './props';
	import { slugify } from '$lib/util/string.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';

	const { path, config, form }: ToggleProps = $props();

	const field = $derived(form.useField(path, config));
	const inputId = slugify(`${form.key}-${path}`);

	const onCheckedChange = (bool: boolean) => {
		field.value = bool;
	};
</script>

<fieldset class="rz-toggle-field {config.className || ''}" use:root={field}>
	<Switch data-error={field.error ? '' : null} checked={field.value} {onCheckedChange} id={inputId} />
	<Field.LabelFor {config} for={inputId} />
</fieldset>

<style lang="postcss">
	.rz-toggle-field {
		@mixin my var(--rz-size-3);
		display: flex;
		align-items: center;
	}
	.rz-toggle-field > :global(* + *) {
		margin-left: var(--rz-size-2);
	}
</style>
