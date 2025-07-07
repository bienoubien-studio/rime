<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input/index.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { TextFieldProps } from './props.js';
	import { capitalize } from '$lib/util/string.js';

	const { path, config, type = 'text', form, icon: Icon }: TextFieldProps = $props();
	const field = $derived(form.useField(path || config.name, config));

	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};
</script>

<fieldset
	class="rz-text-field {config.className || ''}"
	class:rz-text-field--with-icon={!!Icon}
	class:rz-text-field--compact={config.layout === 'compact'}
	use:root={field}
>
	<Field.Label {config} />
	<div class="rz-text-field__input-wrapper">
		{#if Icon}
			<Icon size="12" />
		{/if}
		<Input
			id={path || config.name}
			name={path || config.name}
			placeholder={config.placeholder || capitalize(config.name)}
			data-error={field.error ? '' : null}
			{type}
			value={field.value}
			oninput={onInput}
		/>
	</div>
	<Field.Error error={field.error} />
</fieldset>

<style lang="postcss">
	

	.rz-text-field.rz-text-field--compact :global {
		.rz-label {
			display: none;
		}
		.rz-field-error {
			top: var(--rz-size-1);
			right: var(--rz-size-1);
		}
		.rz-input {
			font-size: var(--rz-text-md);
			padding: 0 var(--rz-size-5);
		}
	}

	.rz-text-field--with-icon {
		.rz-text-field__input-wrapper {
			position: relative;
			display: flex;
			align-items: center;

			:global(.rz-input) {
				padding: 0 0 0 2rem;
			}

			:global(.rz-button) {
				position: absolute;
				right: var(--rz-size-1-5);
				top: var(--rz-size-1-5);
			}

			:global(svg) {
				opacity: 0.5;
				position: absolute;
				left: 0.75rem;
				top: calc(50% - 6px);
			}
		}
	}
</style>
