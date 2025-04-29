<script lang="ts">
	import { Field } from '$lib/panel';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import * as Popover from '$lib/panel/components/ui/popover/index.js';
	import { Button } from '$lib/panel/components/ui/button/index.js';
	import { Check, ChevronsUpDown } from '@lucide/svelte';
	import { t__ } from '$lib/i18n/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { ComboBoxProps } from './props';
	import type { Option } from '$lib/types/fields.js';
	import './combobox.css'
	
	const { path, config, form }: ComboBoxProps = $props();

	const field = $derived(form.useField(path, config));
	const options = config.options;
	const initialValue = form.getRawValue(path!);
	let search = $state('');
	let open = $state(false);
	let value = $state(initialValue);
	let selected = $state<Option | undefined>(options.find((o) => o.value === initialValue));

	$effect(() => {
		if (selected && field.value !== selected.value) {
			field.value = selected.value;
		}
	});
</script>

<fieldset class="rz-combobox-field {config.className || ''}" use:root={field}>
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
					{selected?.label || 'Select...'}
					<ChevronsUpDown class="rz-combobox__chevron" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content class="rz-combobox__content">
				<Command.Root>
					{#if options.length > 8}
						<Command.Input
							bind:value={search}
							placeholder={t__('common.search')}
							class="rz-combobox__search"
						/>
					{/if}
					<Command.Empty>Nothing found.</Command.Empty>
					<Command.Group>
						{#each options as option}
							<Command.Item
								class="rz-combobox__item"
								value={option.value}
								onSelect={() => {
									selected = option;
									value = selected.value;
									search = '';
									open = false;
								}}
							>
								{option.label}
								<Check
									class={`rz-combobox__check ${value !== option.value ? 'rz-combobox__check--hidden' : ''}`}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
	<Field.Error error={field.error} />
</fieldset>