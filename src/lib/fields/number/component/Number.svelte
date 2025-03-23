<script lang="ts">
	import './number.css';
	import { Field } from 'rizom/panel/components/fields/index.js';
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import type { NumberFieldProps } from './props';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';

	const { path, config, form }: NumberFieldProps = $props();

	const field = $derived(form.useField(path, config));
	const initialValue = form.getRawValue(path);

	let value = $state(initialValue);

	const decrease = () => {
		const minValue = config.min ?? -Infinity;
		value = Math.max(value - 1, minValue);
	};

	const increase = () => {
		const maxValue = config.max ?? Infinity;
		value = Math.min(value + 1, maxValue);
	};

	$effect(() => {
		if (value !== field.value) {
			field.value = value;
		}
	});
</script>

{#snippet chevron(Icon: any, func: any, clss: string)}
	<button type="button" class="rz-number-field__chevron {clss}" onclick={func}>
		<Icon size={12} />
	</button>
{/snippet}

<fieldset class="rz-number-field {config.className || ''}" use:root={field}>
	<Field.Label {config} />

	<div class="rz-number-field__input-wrapper">
		<input
			class="rz-number-field__input"
			min={config.min ?? undefined}
			max={config.max ?? undefined}
			bind:value
			type="number"
		/>
		<div class="rz-number-field__controls">
			{@render chevron(ChevronUp, increase, 'rz-number-field__chevron--up')}
			{@render chevron(ChevronDown, decrease, 'rz-number-field__chevron--down')}
		</div>
	</div>

	<Field.Error error={field.error} />
</fieldset>

<style lang="postcss">
	.rz-number-field {
		width: 6rem;
	}

	.rz-number-field__input-wrapper {
		display: flex;
		height: var(--rz-size-11);
		align-items: center;
		border-radius: var(--rz-radius-lg);
	}

	.rz-number-field__input {
		background-color: hsl(var(--rz-color-input));
		height: 100%;
		width: 100%;
		flex: 1;
		justify-content: center;
		border-top-left-radius: var(--rz-radius-lg);
		border-bottom-left-radius: var(--rz-radius-lg);
		border: var(--rz-border);
		text-align: center;
		font-size: var(--rz-text-sm);
		transition: all 0.2s ease;
	}

	.rz-number-field__input:focus-visible {
		/* --rz-ring-offset: 1px; */
		position: relative;
		z-index: 10;
		@mixin ring var(--rz-color-ring);
		outline: none;
	}

	.rz-number-field__controls {
		display: flex;
		flex-direction: column;
		height: var(--rz-size-11);
	}

	.rz-number-field__chevron {
		background-color: hsl(var(--rz-color-input));
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--rz-size-8);
		flex: 1;
		border-right: var(--rz-border);
		transition: all 0.2s ease;
	}

	.rz-number-field__chevron:hover {
		background-color: hsl(var(--rz-ground-5));
	}

	.rz-number-field__chevron:focus-visible {
		/* --rz-ring-offset: 1px; */
		@mixin ring var(--rz-color-ring);
		position: relative;
		z-index: 10;
		outline: none;
	}

	.rz-number-field__chevron--up {
		border-top: var(--rz-border);
		border-top-right-radius: var(--rz-radius-lg);
		border-bottom: var(--rz-border);
	}

	.rz-number-field__chevron--down {
		border-bottom-right-radius: var(--rz-radius-lg);
		border-bottom: var(--rz-border);
	}

	/* Chrome, Safari, Edge, Opera */
	.rz-number-field__input::-webkit-outer-spin-button,
	.rz-number-field__input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	.rz-number-field__input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
</style>
