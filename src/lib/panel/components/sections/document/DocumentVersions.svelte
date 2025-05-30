<script lang="ts">
	import { goto } from '$app/navigation';
	import Versions from '$lib/panel/components/sections/document/Versions.svelte';
	import type { GenericDoc, PrototypeSlug } from '$lib/core/types/doc';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import Document from '$lib/panel/components/sections/document/Document.svelte';
	import { PaneGroup, Pane, PaneResizer } from '$lib/panel/components/ui/pane/index.js';
	import { setAPIProxyContext } from '$lib/panel/context/api-proxy.svelte';

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
	<PaneGroup
		class="rz-document-versions-container"
		autoSaveId="rz-document-versions:panel-state"
		direction="horizontal"
	>
		<Pane minSize={50} defaultSize={70}>
			{#key `${data.doc.id}-${data.doc.versionId}`}
				<Document
					class="rz-document-versions-container__doc"
					doc={data.doc}
					onClose={() => goto(`/panel/${slug}`, { invalidateAll: true })}
					operation={data.operation}
					readOnly={data.readOnly}
				/>
			{/key}
		</Pane>
		<PaneResizer />
		<Pane minSize={30}>
			{#key data.doc.updatedAt?.toString()}
				<Versions doc={data.doc} />
			{/key}
		</Pane>
	</PaneGroup>
{:else}
	<Unauthorized />
{/if}

<style lang="postcss">
	:global(.rz-document-versions-container) {
		container-name: rz-document-versions-container;
		container-type: inline-size;
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		& :global(.rz-document) {
			grid-column: span 12 / span 12;
			min-height: 100vh;
		}
	}
	
	:global(.rz-document-versions-container) :global(.rz-document) {
		border-left: var(--rz-border);
		grid-column: span 9 / span 9;
	}

</style>
