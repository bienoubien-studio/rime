<script lang="ts">
	import { Field } from 'rizom/panel';
	import * as Command from '$lib/panel/components/ui/command';
	import * as Popover from '$lib/panel/components/ui/popover';
	import { Button } from '$lib/panel/components/ui/button';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import './combobox.css';
	import type { ComboBoxProps } from './props';

	const { path, config, form }: ComboBoxProps = $props();

	const field = $derived(form.useField(path, config));

	const options = config.options;

	let open = $state(false);
	let value = $state('');

	const selectedValue = $derived(options.find((f) => f.value === value)?.label ?? 'Select...');

	$effect(() => {
		if (field.value !== selectedValue) {
			field.value = selectedValue;
		}
	});
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					class="rz-combobox__trigger"
					{...props}
				>
					{selectedValue}
					<ChevronsUpDown class="rz-combobox__chevron" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="rz-combobox__content">
			<Command.Root>
				{#if options.length > 8}
					<Command.Input placeholder="Search..." class="rz-combobox__search" />
				{/if}
				<Command.Empty>Nothing found.</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item class="rz-combobox__item" value={option.value}>
							{option.label}
							<Check
								class={`rz-combobox__check ${value !== option.value ? 'rz-combobox__check--hidden' : ''}`}
							/>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	<Field.Error error={field.error} />
</Field.Root>
