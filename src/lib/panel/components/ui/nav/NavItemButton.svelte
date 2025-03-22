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
		height: calc(var(--rz-size-14) - 1px);
		padding: var(--rz-size-2) var(--rz-size-0);
		white-space: nowrap;
		@mixin font-normal;
		justify-content: start;
		transition-property: box-shadow, color, background-color, border-color, text-decoration-color,
			fill, stroke;
		transition-duration: 0.25s;
		
		gap: var(--rz-size-3);
		&:not(:last-child) {
			border-bottom: 1px solid hsl(var(--rz-color-border) / 0.5);
		}
	}

	.rz-button-nav--active {
		text-decoration: underline;
		position: relative;
	}

	.rz-button-nav__icon {
		color: hsl(var(--rz-ground-1));
	}
	.rz-button-nav--active .rz-button-nav__icon {
		color: hsl(var(--rz-ground-0));
	}
</style>
