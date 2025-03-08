<script lang="ts">
	import { getLocaleContext } from '$lib/panel/context/locale.svelte.js';
	import { capitalize, slugify } from '$lib/util/string.js';
	import { Label } from '../ui/label/index.js';
	import type { AnyFormField } from 'rizom/types/fields.js';

	type Props = { config: AnyFormField };
	const { config }: Props = $props();

	const locale = getLocaleContext();
</script>

<Label class="rz-field-label-for" for={slugify(config.name)}>
	{config.label || capitalize(config.name)}
	{#if config.localized}
		<sup>{locale.code}</sup>
	{/if}
</Label>

<style type="postcss">
	:global {
		.rz-field-label-for {
			cursor: pointer;
			margin-bottom: 0;
			@mixin font-semibold;
		}
		.rz-field-label-for sup {
			font-size: var(--rz-text-2xs);
			text-transform: uppercase;
		}
	}
</style>
