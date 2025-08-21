<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type PrimitiveInputAttributes = WithElementRef<HTMLInputAttributes>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithoutChildren<PrimitiveInputAttributes> = $props();
</script>

<input bind:this={ref} class="rz-input {className}" bind:value {...restProps} />

<style type="postcss">
	:root {
		--rz-input-border-color: light-dark(hsl(var(--rz-gray-14)), hsl(var(--rz-gray-6) / 0.6));
		--rz-input-padding-x: var(--rz-size-3);
		--rz-input-padding-y: var(--rz-size-1);
	}

	.rz-input {
		border: 1px solid var(--rz-input-border-color);
		background-color: hsl(var(--rz-color-input));
		display: flex;
		height: var(--rz-input-height);
		width: 100%;
		border-radius: var(--rz-radius-lg);
		transition: all 0.1s ease-in-out;
		padding: var(--rz-input-padding-y) var(--rz-input-padding-x);
	}

	input.rz-input:is(:-webkit-autofill, :autofill) {
		--color: color-mix(in lch, hsl(var(--rz-color-input)), hsl(var(--rz-color-spot)) 12%);
		background-color: var(--color) !important;
		box-shadow: 0 0 0 1000px var(--color) inset !important;
		color: hsl(var(--rz-color-fg) / 1) !important;
		-webkit-text-fill-color: hsl(var(--rz-color-fg) / 1) !important;
	}
	input.rz-input:is(:-webkit-autofill, :autofill):focus {
		--color: color-mix(in lch, hsl(var(--rz-color-input)), hsl(var(--rz-color-spot)) 24%);
		background-color: var(--color) !important;
		box-shadow: 0 0 0 1000px var(--color) inset !important;
		color: hsl(var(--rz-color-fg) / 1) !important;
		-webkit-text-fill-color: hsl(var(--rz-color-fg) / 1) !important;
	}

	.rz-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.rz-input::placeholder {
		@mixin color color-fg, 0.5;
	}

	.rz-input:focus-visible {
		outline: none;
		/* --rz-ring-offset: 1px; */
		@mixin ring var(--rz-color-ring);
	}

	.rz-input[data-error] {
		outline: none;
		@mixin ring var(--rz-color-alert);
	}
</style>
