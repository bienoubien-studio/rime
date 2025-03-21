<script lang="ts">
	import { Field } from '$lib/panel';
	import type { TextFieldProps } from './props.js';

	const { path, config, form }: TextFieldProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLTextAreaElement).value;
	};

	const classNameCompact = config.layout === 'compact' ? 'rz-text-field--compact' : '';
	const classNames = `${config.className} ${classNameCompact || ''}`;
</script>

<Field.Root class={classNames} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<textarea
		id={path || config.name}
		name={path || config.name}
		placeholder={config.placeholder}
		data-error={field.error ? '' : null}
		value={field.value}
		oninput={onInput}
	></textarea>
	<Field.Error error={field.error} />
</Field.Root>

<style type="postcss">

	
	textarea {
		field-sizing: content;
		border: var(--rz-border);
		background-color: hsl(var(--rz-color-input));
		display: flex;
		width: 100%;
		border-radius: var(--rz-radius-md);
		/* font-size: var(--rz-text-sm); */
		line-height: 1.5em;
		min-height: var(--rz-size-20);
		@mixin px var(--rz-size-3);
		@mixin py var(--rz-size-2);
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

	textarea[data-error] {
		outline: none;
		@mixin ring var(--rz-color-error);
	}

	/* .rz-input:-internal-autofill-selected {
		background-color: hsl(var(--rz-color-input) / 100) !important;
	} */
</style>
