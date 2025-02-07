<script lang="ts">
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';

	type Props = { form: DocumentFormContext };
	const { form }: Props = $props();

	if (!(form.config.type === 'collection')) throw new Error('Expected collection config');

	const status = form.doc.status;
	const statusConfig = form.config.status;

	console.log(statusConfig);
</script>

<button class="rz-document-status" type="button"> </button>

<style>
	.rz-document-status {
	}
</style>
