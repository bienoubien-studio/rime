<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes & {
		icon?: any;
		active?: boolean;
	};

	let { class: className, active = false, icon, children, ...restProps }: Props = $props();

	const activeModifier = $derived(active ? 'rz-button-nav--active' : '');
</script>

{#snippet iconProp()}
	{#if icon}
		{@const IconProp = icon}
		<div class="rz-button-nav__icon">
			<IconProp size="14" />
		</div>
	{/if}
{/snippet}

<a class="rz-button-nav {activeModifier} {className}" {...restProps}>
	{@render iconProp()}
	{@render children?.()}
</a>

<style type="postcss">
	.rz-button-nav {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* margin-top: calc(var(--rz-size-2)); */
		height: calc(var(--rz-size-14) - 1px);

		padding: var(--rz-size-2) var(--rz-size-4);
		/* border-radius: var(--rz-radius-md); */
		/* font-size: var(--rz-text-sm); */
		white-space: nowrap;
		@mixin font-normal;
		justify-content: start;
		transition-property: box-shadow, color, background-color, border-color, text-decoration-color,
			fill, stroke;
		transition-duration: 0.25s;
		/* background-color: hsl(var(--rz-ground-5) / 0); */
		gap: var(--rz-size-3);
		&:not(:last-child) {
			border-bottom: 1px solid hsl(var(--rz-color-border) / 0.5);
		}
	}
	.rz-button-nav:hover {
		/* background-color: hsl(var(--rz-ground-5) / 0.5); */
	}
	.rz-button-nav--active {
		text-decoration: underline;
		/* background-color: hsl(var(--rz-ground-5) / 0.6); */
		position: relative;
		/* @mixin font-semibold; */
		/* box-shadow: var(--rz-shadow-sm); */
	}

	.rz-button-nav--active:hover {
		/* background-color: hsl(var(--rz-ground-5) / 0.6); */
	}

	.rz-button-nav__icon {
		color: hsl(var(--rz-ground-1));
	}
	.rz-button-nav--active .rz-button-nav__icon {
		color: hsl(var(--rz-ground-0));
	}
</style>
