<script lang="ts">
	import { Home } from '@lucide/svelte';
	import { page } from '$app/state';
	import Button from '../button/button.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte.js';
	import { getContext } from 'svelte';
	// type Props = {  }
	// const { }: Props = $props()
	const config = getConfigContext();
	const titleContext = getContext<{ value: string }>('title');
</script>

<div class="rz-aria">
	{#each page.data.aria as route}
		{@const Icon = config.raw.icons[route.icon]}
		{#if route.path}
      <Button variant="text" icon={Icon} href={route.path}>
				{route.title}
			</Button>
			<span>/</span>
		{:else}
      <span class="rz-aria__last">{titleContext.value}</span>
		{/if}
	{/each}
</div>

<style lang="postcss">
	.rz-aria {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
    > *, > :global(.rz-button) { 
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }
    > *:hover, > :global(.rz-button:hover) { 
      opacity: 1;
    }
	}
  .rz-aria__last{
    opacity: 1;
  }
</style>
