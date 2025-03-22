<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from 'rizom/panel';
	import type { EmailFieldProps } from './props';
	import { capitalize } from 'rizom/util/string';
	import { Mail } from '@lucide/svelte';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';

	const { path, config, form }: EmailFieldProps = $props();

	const field = $derived(form.useField(path, config));
	let showError = $state(false);

	// Actions
	const onInput = (event: Event) => {
		showError = false;
		field.value = (event.target as HTMLInputElement).value;
	};

	const onBlur = () => {
		showError = true;
	};

	const classNameCompact = config.layout === 'compact' ? 'rz-email-field--compact' : '';
	const classNames = `${config.className} rz-email-field ${classNameCompact || ''}`;
</script>

<fieldset class={classNames} use:root={field}>
	<Field.Label {config} />
	<div class="rz-email-field-wrapper">
		<Mail class="rz-email-field__icon" size="12" />
		<Input
			id={path || config.name}
			name={path || config.name}
			placeholder={capitalize(config.label || config.name)}
			data-error={showError && field.error ? '' : null}
			value={field.value}
			onblur={onBlur}
			oninput={onInput}
		/>
	</div>
	<Field.Error error={(showError && field.error) || false} />
</fieldset>

<style>
	.rz-email-field--compact :global {
		label {
			display: none;
		}
		.rz-field-error {
			top: calc(-1 * var(--rz-size-6));
		}
		.rz-input {
			font-size: var(--rz-text-md);
			padding: 0 var(--rz-size-5);
			height: var(--rz-size-14);
		}
	}

	.rz-email-field-wrapper {
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

		:global(.rz-email-field__icon) {
			opacity: 0.37;
			position: absolute;
			left: 0.75rem;
			top: calc(50% - 6px);
		}
	}
</style>
