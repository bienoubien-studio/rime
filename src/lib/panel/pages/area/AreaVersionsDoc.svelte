<script lang="ts">
	import DocumentVersions from '$lib/panel/components/sections/document/DocumentVersions.svelte';
	import type { GenericDoc, PrototypeSlug } from '$lib/types';
	
  type Props = {
		slug: PrototypeSlug;
		data: {
			doc: GenericDoc;
			status: number;
			readOnly: boolean;
			operation: 'create' | 'update';
		};
	};

	const { data, slug }: Props = $props();
  
</script>

<DocumentVersions {data} {slug} />
