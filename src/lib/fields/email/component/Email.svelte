<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input';
	import { Field } from 'rizom/panel';
	import type { EmailFieldProps } from './props';
	import { capitalize } from 'rizom/util/string';
	import './email.css';
	import { Mail } from '@lucide/svelte';

	const { path, config, form }: EmailFieldProps = $props();

	const field = $derived(form.useField(path, config));
	let showError = $state(false);

	// Actions
	const onInput = (event: Event) => {
		showError = false;
		field.value = (event.target as HTMLInputElement).value;
	};

	const onBlur = () => {
		showError = true;
	};

	const classNameCompact = config.layout === 'compact' ? 'rz-email-field--compact' : '';
	const classNames = `${config.className} rz-email-field ${classNameCompact || ''}`;
</script>

<Field.Root class={classNames} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />
	<div class="rz-email-field-wrapper">
		<Mail class="rz-email-field__icon" size="12" />
		<Input
			id={path || config.name}
			name={path || config.name}
			placeholder={capitalize(config.label || config.name)}
			data-error={showError && field.error ? '' : null}
		value={field.value}
		onblur={onBlur}
		oninput={onInput}
	/>
	</div>
	<Field.Error error={(showError && field.error) || false} />
</Field.Root>
