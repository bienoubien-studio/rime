<script lang="ts">
	import { Calendar as CalendarIcon } from 'lucide-svelte';
	import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/panel/components/ui/button/index.js';
	import { Calendar } from '$lib/panel/components/ui/calendar/index.js';
	import * as Popover from '$lib/panel/components/ui/popover/index.js';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { Field } from '$lib/panel/components/fields/index.js';
	import type { DateField } from 'rizom/types/fields';
	import './date.css';

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

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<Popover.Root>
		<Popover.Trigger>
			<Button
				variant="secondary"
				data-empty={!calendarDate ? '' : null}
				data-error={field.error ? '' : null}
				class="rz-date__button"
			>
				<CalendarIcon class="rz-date__icon" />
				{dateLabel}
			</Button>
		</Popover.Trigger>
		<Popover.Content align="start" class="rz-date__popover-content">
			<Calendar type="single" bind:value={calendarDate} initialFocus />
		</Popover.Content>
	</Popover.Root>
	<Field.Error error={field.error} />
</Field.Root>
