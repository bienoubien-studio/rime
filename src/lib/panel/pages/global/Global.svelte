<script lang="ts">
	import Document from 'rizom/panel/components/areas/document/Document.svelte';
	import type { GenericDoc, GlobalSlug } from 'rizom/types/doc';

	type Props = {
		data: { doc: GenericDoc | {}; readOnly?: boolean };
		slug: GlobalSlug;
	};
	const { data }: Props = $props();
</script>

<div class="rz-global-container">
	<Document doc={data.doc} readOnly={data.readOnly} operation="update" />
</div>

<style type="postcss">
	.rz-global-container {
		display: grid;
	}
</style>
