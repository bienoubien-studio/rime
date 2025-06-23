<script lang="ts">
	import Document from '$lib/panel/components/sections/document/Document.svelte';
	import Versions, { type Version } from '$lib/panel/components/sections/document/Versions.svelte';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { API_PROXY, setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte.js';
	import type { GenericDoc, PrototypeSlug } from '$lib/types';

	type Props = {
		slug: PrototypeSlug;
		data: {
			doc: GenericDoc;
			status: number;
			readOnly: boolean;
			operation: 'create' | 'update';
			versions: Version[];
		};
	};

	const { data }: Props = $props();

	setAPIProxyContext(API_PROXY.DOCUMENT);
</script>

{#if data.status === 200}
	{#key data.doc.id + data.doc.versionId || '' + data.doc.locale || ''}
		<Page>
			{#snippet main()}
				<Document doc={data.doc} operation={data.operation} readOnly={data.readOnly} />
			{/snippet}
			{#snippet aside()}
				<Versions doc={data.doc} versions={data.versions} />
			{/snippet}
		</Page>
	{/key}
{:else}
	<Unauthorized />
{/if}
