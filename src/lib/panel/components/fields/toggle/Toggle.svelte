<script lang="ts">
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { slugify } from '$lib/utils/string.js';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { Field } from '../index';
	import './toggle.css';

	import type { ToggleField } from 'rizom/types/fields';

	// Props
	type Props = { path: string; config: ToggleField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onCheckedChange = (bool: boolean) => {
		field.value = bool;
	};
</script>

<Field.Root class="rz-toggle-field" visible={field.visible} disabled={form.readOnly}>
	<Switch
		data-error={field.error ? '' : null}
		checked={field.value}
		{onCheckedChange}
		id={slugify(config.name)}
	/>
	<Field.LabelFor {config} />
</Field.Root>
