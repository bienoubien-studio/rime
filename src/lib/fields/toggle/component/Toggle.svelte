<script lang="ts">
	import './toggle.css';
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { slugify } from '$lib/utils/string.js';
	import { Field } from 'rizom/panel';
	import type { ToggleProps } from './props';

	const { path, config, form }: ToggleProps = $props();

	const field = $derived(form.useField(path, config));

	// Actions
	const onCheckedChange = (bool: boolean) => {
		field.value = bool;
	};
</script>

<Field.Root class="rz-toggle-field" visible={field.visible} disabled={!field.editable}>
	<Switch
		data-error={field.error ? '' : null}
		checked={field.value}
		{onCheckedChange}
		id={slugify(config.name)}
	/>
	<Field.LabelFor {config} />
</Field.Root>
