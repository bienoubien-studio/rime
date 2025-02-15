<script lang="ts">
	import { type Props } from './index.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		icon,
		children,
		...restProps
	}: Props = $props();
</script>

{#snippet iconProp()}
	{#if icon}
		{@const IconProp = icon}
		{#if variant === 'text'}
			<div class="rz-button--text__icon">
				<IconProp size="15" strokeWidth="2px" />
			</div>
		{:else}
			<div class="rz-button__icon">
				<IconProp size="12" strokeWidth="2px" />
			</div>
		{/if}
	{/if}
{/snippet}

{#if href}
	<a
		bind:this={ref}
		{href}
		class="rz-button rz-button--size-{size} rz-button--{variant} {className}"
		{...restProps}
	>
		{@render iconProp()}
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class="rz-button rz-button--size-{size} rz-button--{variant} {className}"
		{type}
		{...restProps}
	>
		{@render iconProp()}
		{@render children?.()}
	</button>
{/if}

<style type="postcss">
	.rz-button {
		flex-shrink: var(--rz-flex-shrink, unset);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--rz-radius-md);
		font-size: var(--rz-text-sm);
		white-space: nowrap;
		@mixin font-medium;
		transition-property: box-shadow, color, background-color, border-color, text-decoration-color,
			fill, stroke;
		transition-duration: 0.25s;
		gap: var(--rz-size-2);
	}

	.rz-button:focus-visible {
		/* --rz-ring-offset: 1px; */
		outline: none;
		@mixin ring var(--rz-color-ring);
	}

	.rz-button:disabled,
	.rz-button[disabled='true'] {
		opacity: 0.7;
		pointer-events: none;
		cursor: not-allowed !important;
	}

	/**************************************/
	/* Sizes */
	/**************************************/

	.rz-button--size-default {
		height: var(--rz-size-9);
		padding: var(--rz-size-2) var(--rz-size-4);
	}

	.rz-button--size-sm {
		height: var(--rz-size-8);
		padding: var(--rz-size-2) var(--rz-size-3);
		border-radius: var(--rz-radius-md);
	}

	.rz-button--size-lg {
		height: var(--rz-size-12);
		padding: var(--rz-size-2) var(--rz-size-8);
		border-radius: var(--rz-radius-md);
	}

	.rz-button--size-xl {
		height: var(--rz-size-14);
		font-size: var(--rz-text-md);
		padding: var(--rz-size-2) var(--rz-size-8);
		border-radius: var(--rz-radius-md);
	}

	.rz-button--size-icon {
		height: var(--rz-size-9);
		width: var(--rz-size-9);
		padding: var(--rz-size-2);
	}

	.rz-button--size-icon-sm {
		height: var(--rz-size-8);
		width: var(--rz-size-8);
	}

	/**************************************/
	/* Variants */
	/**************************************/

	.rz-button--default {
		background-color: hsl(var(--rz-color-primary) / 1);
		color: hsl(var(--rz-color-primary-fg) / 1);
	}

	.rz-button--default:hover {
		background-color: hsl(var(--rz-color-primary) / 0.9);
	}

	.rz-button--default:disabled {
		background-color: hsl(var(--rz-ground-2) / 1);
	}

	.rz-button--outline {
		border: 1px solid hsl(var(--rz-ground-3));
		background-color: hsl(var(--rz-ground-5) / 0);
		color: hsl(var(--rz-color-fg));
		&:hover {
			background-color: hsl(var(--rz-ground-5) / 1);
		}
	}

	.rz-button--ghost {
		background-color: hsl(var(--rz-ground-4) / 0);
		color: hsl(var(--rz-color-ground-0));
		&:hover {
			background-color: hsl(var(--rz-ground-4) / 1);
		}
	}

	.rz-button--secondary {
		background-color: hsl(var(--rz-ground-5));
		color: hsl(var(--rz-ground-0));
		fill: hsl(var(--rz-ground-0));
		&:hover {
			background-color: hsl(var(--rz-color-secondary) / 0.7);
		}
	}

	.rz-button--link {
		color: hsl(var(--rz-color-primary));
		background: none;
		text-underline-offset: 4px;
		&:hover {
			text-decoration: underline;
		}
	}

	.rz-button--text {
		--opacity: 0.1 padding-left: 0;
		padding-right: 0;
		background-color: transparent;
		color: hsl(var(--rz-color-fg) / var(--opacity));
		@mixin font-medium;
		gap: var(-rz-size-2);
		&:hover {
			--opacity: 1;
		}
		&:disabled {
			--opacity: 0.4;
		}
	}

	/**************************************/
	/* With Icon */
	/**************************************/

	.rz-button__icon {
		/* color: hsl(var(--rz-color-primary)); */
		/* translate: calc(-1 * var(--rz-size-1)); */
	}
	.rz-button__icon,
	.rz-button--text__icon {
		display: grid;
		place-content: center;
		border-radius: var(--rz-radius-sm);
		@mixin size var(--rz-size-5);
	}
</style>
