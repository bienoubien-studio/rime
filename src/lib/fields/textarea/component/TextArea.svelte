<script lang="ts">
	import { Field } from '$lib/panel/components/fields/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import { dataError } from '$lib/panel/util/dataError.js';
	import type { TextAreaFieldProps } from './props.js';

	const { path, config, form }: TextAreaFieldProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLTextAreaElement).value;
	};
</script>

<fieldset use:root={field} class="rz-textarea-field {config.className || ''}">
	<Field.Label {config} />
	<textarea
		use:dataError={!!field.error}
		id={path || config.name}
		name={path || config.name}
		placeholder={config.placeholder}
		value={field.value}
		oninput={onInput}
	></textarea>
	<Field.Error error={field.error} />
</fieldset>

<style type="postcss">
	textarea {
		field-sizing: content;
		border: var(--rz-border);
		background-color: hsl(var(--rz-color-input));
		display: flex;
		width: 100%;
		border-radius: var(--rz-radius-md);
		line-height: 1.5em;
		min-height: var(--rz-size-20);
		@mixin px var(--rz-size-3);
		@mixin py var(--rz-size-2);

		&:global([data-error]) {
			outline: none;
			@mixin ring var(--rz-color-error);
		}
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	textarea::placeholder {
		@mixin color color-fg, 0.5;
	}

	textarea:focus-visible {
		outline: none;
		/* --rz-ring-offset: 1px; */
		@mixin ring var(--rz-color-ring);
	}
</style>
