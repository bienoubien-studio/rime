<script lang="ts">
	import Document from '$lib/panel/components/sections/document/Document.svelte';
	import type { AreaProps } from './props.js';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte.js';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';

	const { data }: AreaProps = $props();

	setAPIProxyContext('document');
</script>

{#if data.status === 200}
	<Page>
		{#snippet main()}
			<Document doc={data.doc} readOnly={data.readOnly} operation="update" />
		{/snippet}
	</Page>
{:else}
	<Unauthorized />
{/if}
