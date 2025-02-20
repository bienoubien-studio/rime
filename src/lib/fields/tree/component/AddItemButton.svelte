<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { Plus } from 'lucide-svelte';
	import { capitalize } from '$lib/utils/string.js';
	import { emptyFieldsFromFieldConfig } from '$lib/utils/field.js';
	import { isFormField } from '$lib/utils/field.js';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import type { Field } from 'rizom/types/fields.js';
	import TreeBlock from './TreeBlock.svelte';

	type AddItem = (options: Omit<TreeBlock, 'id' | 'path'>) => void;
	type Props = {
		size: 'default' | 'sm';
		class: string;
		fields: Field[];
		addItem: AddItem;
	};
	const { class: className, fields, addItem, size }: Props = $props();

	let open = $state(false);

	const add = () => {
		open = false;
		const empty = {
			_children: [],
			...emptyFieldsFromFieldConfig(fields.filter(isFormField))
		};
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
		{t__('fields.create_one')}
	</span>
</Button>

<style type="postcss">
	:global {
		.rz-add-item-button {
			gap: var(--rz-size-2);
		}
	}
</style>
