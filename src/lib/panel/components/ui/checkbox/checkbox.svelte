<script lang="ts">
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import Minus from 'lucide-svelte/icons/minus';
	import './checkbox.css';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();

	const iconCheckedClass = $derived(!checked ? 'rz-checkbox__icon--unchecked' : '');
</script>

<CheckboxPrimitive.Root
	controlledChecked
	bind:ref
	class="rz-checkbox {className}"
	bind:checked
	{...restProps}
>
	{#snippet children({ checked })}
		<div class="rz-checkbox__indicator">
			{#if checked === 'indeterminate'}
				<Minus class="rz-checkbox__icon" size={10} />
			{:else}
				<Check class="rz-checkbox__icon {iconCheckedClass}" size={10} />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
