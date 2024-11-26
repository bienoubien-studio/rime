<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	type Props = {
		children: Snippet;
		navCollapsed: boolean;
		name: string;
	};
	const { children, name, navCollapsed }: Props = $props();
	const initialCollapsed = localStorage.getItem(`NavGroupCollapsed:${name}`) === 'true';
	let groupCollapsed = $state(initialCollapsed);

	const setCollapsed = () => {
		groupCollapsed = !groupCollapsed;
		localStorage.setItem(`NavGroupCollapsed:${name}`, groupCollapsed.toString());
	};

	const navCollapsedClassModifier = $derived(navCollapsed ? 'rz-nav-group--nav-collapsed' : '');
	const groupCollapsedClassModifier = $derived(groupCollapsed ? 'rz-nav-group--collapsed' : '');
</script>

<div class="rz-nav-group {navCollapsedClassModifier} {groupCollapsedClassModifier}">
	{#if !navCollapsed}
		<button onclick={setCollapsed} class="rz-nav-group__trigger">
			<span>{name}</span>
			{#if groupCollapsed}
				<ChevronDown size="12" />
			{:else}
				<ChevronUp size="12" />
			{/if}
		</button>
	{/if}
	{#if !groupCollapsed || navCollapsed}
		<div class="rz-nav-group__content">
			{@render children()}
		</div>
	{/if}
</div>

<style type="postcss" global>
	.rz-nav-group {
		width: 100%;
		margin-bottom: var(--rz-size-3);
	}
	.rz-nav-group--collapsed {
		margin-bottom: 0;
	}
	.rz-nav-group--nav-collapsed {
		border-top: var(--rz-border);
		padding-top: var(--rz-size-2);
		margin-bottom: 0;
	}

	.rz-nav-group__content {
		display: grid;
		gap: var(--rz-size-1);
	}

	.rz-nav-group__trigger {
		font-size: var(--rz-text-2xs);
		@mixin color ground-2;
		margin-bottom: var(--rz-size-2);
		margin-left: var(--rz-size-2);
		display: flex;
		gap: var(--rz-size-2);
		align-items: center;
		justify-content: space-between;
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.0625rem;
	}
</style>
