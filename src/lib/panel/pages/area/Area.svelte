<script lang="ts">
	import Document from '$lib/panel/components/sections/document/Document.svelte';
	import type { AreaProps } from './props.js';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { API_PROXY, setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte.js';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';

	const { data }: AreaProps = $props();

	setAPIProxyContext(API_PROXY.DOCUMENT);
</script>

{#if data.status === 200}
	<Page>
		{#snippet main()}
			{#key data.doc.id + data.doc.versionId || '' + data.doc.locale || ''}
				<Document doc={data.doc} readOnly={data.readOnly} operation="update" />
			{/key}
		{/snippet}
	</Page>
{:else}
	<Unauthorized />
{/if}
