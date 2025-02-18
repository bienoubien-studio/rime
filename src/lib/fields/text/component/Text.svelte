<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from '$lib/panel';
	import type { TextFieldProps } from './props.js';
	import { capitalize } from 'rizom/utils/string.js';

	const { path, config, type = 'text', form }: TextFieldProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};

	const classNameTitle = config.isTitle ? 'rz-text-field--title' : '';
	const classNameCompact = config.layout === 'compact' ? 'rz-text-field--compact' : '';
	const classNames = `${config.className} ${classNameTitle || classNameCompact || ''}`;
</script>

<Field.Root class="rz-text-field {classNames}" visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		placeholder={capitalize(config.label || config.name)}
		data-error={field.error ? '' : null}
		{type}
		value={field.value}
		oninput={onInput}
	/>
	<Field.Error error={field.error} />
</Field.Root>

<style>
	:global(.rz-text-field--compact) {
		:global(label) {
			display: none;
		}
		:global(fieldset .rz-field-error) {
			top: calc(-1 * var(--rz-size-6));
		}
		:global(.rz-input) {
			font-size: var(--rz-text-xl);
			padding: 0 var(--rz-size-5);
			height: var(--rz-size-14);
		}
	}
	:global(.rz-text-field--title) {
		--rz-color-ring: red !important;

		:global(label) {
			display: none;
		}
		:global(fieldset .rz-field-error) {
			top: calc(-1 * var(--rz-size-6));
		}
		:global(.rz-input) {
			font-size: var(--rz-text-3xl);
			@mixin font-semibold;
			padding: 0 var(--rz-size-5);
			height: var(--rz-size-14);
			background-color: transparent;
			/* padding: 0; */
			border: none;
			border-left: 4px solid hsl(var(--rz-color-border));
		}
	}
</style>
