<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { Plus } from '@lucide/svelte';
	import { capitalize } from '$lib/util/string.js';
	import { emptyValuesFromFieldConfig } from '$lib/util/field.js';
	import { isFormField } from '$lib/util/field.js';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import type { Field } from 'rizom/types/fields.js';
	import type { Dic } from 'rizom/types/util';
	import type { Snippet } from 'svelte';

	type AddItem = (emptyValues: Dic) => void;
	type Props = {
		size: 'default' | 'sm';
		class: string;
		fields: Field[];
		addItem: AddItem;
		children: Snippet;
	};
	const { class: className, fields, addItem, size, children }: Props = $props();

	const add = () => {
		const empty = emptyValuesFromFieldConfig(fields.filter(isFormField));
		addItem(empty);
	};
</script>

<Button
	icon={Plus}
	class="rz-add-item-button {className}"
	onclick={() => add()}
	variant="outline"
	{size}
>
	<span>
		{@render children()}
	</span>
</Button>

<style type="postcss">
	:global {
		.rz-add-item-button {
			gap: var(--rz-size-2);
		}
	}
</style>
