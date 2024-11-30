<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from 'rizom/panel';
	import type { EmailFieldProps } from './props';

	const { path, config, form }: EmailFieldProps = $props();

	const field = $derived(form.useField(path, config));
	let hasErrorAfterInput = $state(false);

	// Actions
	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};

	const onBlur = () => {
		hasErrorAfterInput = !!field.error;
	};
</script>

<Field.Root visible={field.visible} disabled={form.readOnly}>
	<Field.Label {config} />
	<Input
		id={path || config.name}
		name={path || config.name}
		data-error={hasErrorAfterInput ? '' : null}
		onblur={onBlur}
		value={field.value}
		oninput={onInput}
	/>
	<Field.Error error={hasErrorAfterInput ? field.error : false} />
</Field.Root>
