<script lang="ts">
	import { Calendar as CalendarIcon } from '@lucide/svelte';
	import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/panel/components/ui/button/index.js';
	import { Calendar } from '$lib/panel/components/ui/calendar/index.js';
	import * as Popover from '$lib/panel/components/ui/popover/index.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { Field } from '$lib/panel/components/fields/index.js';
	import type { DateField } from '../index.js';
	import { root } from 'rizom/panel/components/fields/root.svelte.js';

	type Props = { path: string; config: DateField; form: DocumentFormContext };

	const { path, config, form }: Props = $props();
	const locale = getLocaleContext();

	const field = $derived(form.useField(path, config));
	const initialValue = form.getRawValue(path) || new Date();

	let calendarDate = $state<DateValue>(
		new CalendarDate(
			initialValue.getFullYear(),
			initialValue.getMonth() + 1,
			initialValue.getDate()
		)
	);

	let date = $state<Date | null>(initialValue);
	let timeZone = getLocalTimeZone();

	$effect(() => {
		date = calendarDate ? calendarDate.toDate(timeZone) : null;
	});

	$effect(() => {
		if (date !== field.value) field.value = date;
	});

	const dateLabel = $derived(date ? locale.dateFormat(date) : 'Select a date');
</script>

<fieldset class="rz-date-field {config.className || ''}" use:root={field}>
	<Field.Label {config} />
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					variant="secondary"
					data-empty={!calendarDate ? '' : null}
					data-error={field.error ? '' : null}
					class="rz-date__button"
					disabled={!field.editable}
					{...props}
				>
					<CalendarIcon class="rz-date__icon" />
					{dateLabel}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content align="start" class="rz-date__popover-content">
				<Calendar type="single" bind:value={calendarDate} initialFocus />
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
	<Field.Error error={field.error} />
</fieldset>

<style lang="postcss">
	.rz-date-field :global {
		.rz-date__button.rz-button {
			background-color: hsl(var(--rz-color-input));
			height: var(--rz-size-11);
			width: 200px;
			justify-content: flex-start;
			border: var(--rz-border);
			padding-left: var(--rz-size-3);
			padding-right: var(--rz-size-3);
			text-align: left;
			font-weight: normal;
		}

		.rz-date__button[data-empty] {
			color: hsl(var(--rz-color-fg) / 0.7);
		}

		.rz-date__button[data-error] {
			border-color: var(--rz-color-error);
		}

		.rz-date__icon {
			margin-right: var(--rz-size-2);
			height: var(--rz-size-4);
			width: var(--rz-size-4);
		}

		.rz-date__popover-content {
			padding: 0;
		}
	}
</style>
