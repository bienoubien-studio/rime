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
	import { root } from '$lib/panel/components/fields/root.svelte.js';

	type Props = { path: string; config: DateField; form: DocumentFormContext };

	const { path, config, form }: Props = $props();
	const locale = getLocaleContext();
	const timeZone = getLocalTimeZone();

	const field = $derived(form.useField(path, config));
	
	// Derive date from field.value
	const date = $derived.by(() => {
		return field.value instanceof Date ? field.value : null;
	});
	
	// Derive calendarDate from date
	const calendarDate = $derived.by(() => {
		if (date) {
			return new CalendarDate(
				date.getFullYear(),
				date.getMonth() + 1,
				date.getDate()
			);
		}
		return undefined;
	});
	
	// Handle calendar selection changes
	function handleCalendarChange(newCalendarDate: DateValue | undefined) {
		if (newCalendarDate) {
			const newDate = newCalendarDate.toDate(timeZone);
			// Only update if the date actually changed
			if (!date || date.getTime() !== newDate.getTime()) {
				field.value = newDate;
			}
		} else if (field.value !== null) {
			field.value = null;
		}
	}

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
				<Calendar 
					type="single" 
					value={calendarDate} 
					onValueChange={handleCalendarChange}
					initialFocus 
				/>
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
