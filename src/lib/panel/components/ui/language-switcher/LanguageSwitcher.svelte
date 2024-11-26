<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { invalidateAll } from '$app/navigation';
	import Cookies from 'js-cookie';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';

	const locale = getLocaleContext();
	const { config } = getConfigContext();
	const locales = $state(config.localization?.locales || []);

	function setLocale(code: string) {
		locale.code = code;
		Cookies.set('Locale', code);
		invalidateAll();
	}
</script>

{#if locales.length}
	<div class="rz-language-switch">
		{#each locales as item}
			<Button
				disabled={item.code === locale.code}
				data-active={item.code === locale.code ? '' : null}
				onclick={() => setLocale(item.code)}
				variant="outline"
				size="icon"
			>
				<span class="rz-language-switch__code">{item.code}</span>
			</Button>
		{/each}
	</div>
{/if}

<style type="postcss">
	.rz-language-switch {
		@mixin mx var(--rz-size-1);
		display: flex;

		& :global([data-active]),
		:global(:disabled) {
			opacity: 1;
			@mixin bg color-primary, 0.1;
			@mixin color color-primary;
		}

		& :global(button) {
			border-radius: 0;
			border-bottom: var(--rz-border);
			border-left: var(--rz-border);
			border-top: var(--rz-border);
			border-right: 0;

			&:first-child {
				@mixin radius-left md;
			}
			&:last-child {
				@mixin radius-right md;
				border-right: var(--rz-border);
			}
		}
	}

	.rz-language-switch__code {
		font-size: var(--rz-text-2xs);
		text-transform: uppercase;
	}
</style>
