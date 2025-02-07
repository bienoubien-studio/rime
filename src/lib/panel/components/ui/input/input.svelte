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
	.rz-input {
		border: var(--rz-border);
		background-color: hsl(var(--rz-color-input));
		display: flex;
		height: var(--rz-size-11);
		width: 100%;
		border-radius: var(--rz-radius-md);
		transition: all 0.1s ease-in-out;
		font-size: var(--rz-text-sm);
		@mixin px var(--rz-size-3);
		@mixin py var(--rz-size-1);
	}

	input.rz-input:-webkit-autofill,
	input.rz-input:autofill,
	input.rz-input:-internal-autofill-selected {
		--color: hsl(var(--rz-color-primary) / 0.2);
		background-color: var(--color) !important;
		box-shadow: 0 0 0 1000px var(--color) inset !important;
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
		@mixin ring var(--rz-color-error);
	}

	.rz-input:-internal-autofill-selected {
		background-color: hsl(var(--rz-color-input) / 100) !important;
	}
</style>
