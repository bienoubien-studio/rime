<script lang="ts">
	import { richTextJSONToText } from '$lib/util/field.js';

	let { value }: { value: string } = $props();

	let textValue: string = richTextJSONToText(value);

</script>

{#if textValue && textValue.length > 10}
	{textValue.substring(0, 20)}...
{:else if textValue}
	{textValue}
{/if}
