<script lang="ts">
	import { PaneGroup, Pane, PaneResizer } from 'rizom/panel/components/ui/pane/index.js';
	import { goto } from '$app/navigation';
	import type { GenericDoc } from 'rizom/types/doc';
	import LiveSidePanel from 'rizom/panel/components/areas/live/SidePanel.svelte';
	import type { BrowserConfig } from 'rizom/types/config';
	import { GripVertical } from 'lucide-svelte';

	type Props = { data: any; config: BrowserConfig };
	const { data, config }: Props = $props();

	let iframe: HTMLIFrameElement;
	let iframeSrc = $state('');
	let sync = $derived(iframeSrc === data.src);

	const onDataChange = (args: Partial<GenericDoc>) => {
		/** Send message to iframe */
		if (iframe?.contentWindow) {
			iframe.contentWindow.postMessage(args);
		}
	};

	const onFieldFocus = (path: string) => {
		/** Send message to iframe */
		if (iframe?.contentWindow) {
			iframe.contentWindow.postMessage({ focus: path });
		}
	};

	// Wrapper tells iframe it's live
	function handshake() {
		if (sync === false) {
			if (iframe && iframe.contentWindow) {
				iframe.contentWindow.postMessage({ handshake: true });
			}
			window.setTimeout(handshake, 200);
		}
	}

	const onIframeMessage = async (e: any) => {
		if (e.data.handshake) {
			iframeSrc = e.data.handshake;
		}
		if (e.data.location) {
			goto(e.data.location);
		}
	};

	$effect(() => {
		if (!sync) {
			handshake();
		}
	});

	$effect(() => {
		if (sync) {
			console.log('live:synced');
		}
	});
</script>

<svelte:window onmessage={onIframeMessage} />

<div class="rz-live-container">
	<PaneGroup direction="horizontal">
		<Pane defaultSize={30}>
			<div class="rz-live-container__side-panel">
				{#key data.src + data.doc.id + data.locale + data.slug}
					<LiveSidePanel
						{config}
						{onDataChange}
						{onFieldFocus}
						doc={data.doc}
						user={data.user}
						locale={data.locale}
						slug={data.slug}
					/>
				{/key}
			</div>
		</Pane>
		<PaneResizer />
		<Pane defaultSize={70}>
			<iframe bind:this={iframe} title="edit" src={data.src}></iframe>
		</Pane>
	</PaneGroup>
</div>

<!-- <PaneGroup direction="horizontal">
	<Pane defaultSize={50}>Pane 1</Pane>
	<PaneResizer />
	<Pane defaultSize={50}>Pane 2</Pane>
</PaneGroup> -->

<style>
	:global(.rz-scroll-area__viewport) {
		position: relative;
	}
	.rz-live-container__side-panel {
		width: 100%;
		/* width: var(--rz-live-sidebar-width); */
		flex-shrink: 0;
		flex-grow: 0;
		border-right: var(--rz-border);
	}
	.rz-live-container iframe {
		width: 100%;
		height: 100%;
	}
</style>
