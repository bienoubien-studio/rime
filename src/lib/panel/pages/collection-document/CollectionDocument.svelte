<script lang="ts">
	
	import type { GenericDoc, PrototypeSlug } from '$lib/core/types/doc';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import Document from '$lib/panel/components/sections/document/Document.svelte';
	import { setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';

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

	setAPIProxyContext('document');
</script>

{#if data.status === 200}
	<Page>
		{#snippet main()}
			<Document
				class="rz-collection-container__doc"
				doc={data.doc}
				operation={data.operation}
				readOnly={data.readOnly}
			/>
		{/snippet}
	</Page>
{:else}
	<Unauthorized />
{/if}
