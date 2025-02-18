<script lang="ts">
	import DropZone from './drop-zone/DropZone.svelte';
	import FileText from 'lucide-svelte/icons/file-text';
	import { capitalize } from '$lib/utils/string.js';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { toast } from 'svelte-sonner';
	import { FileArchive, FileAudio, FileVideo } from 'lucide-svelte';
	import * as util from 'rizom/utils/file.js';
	import type { WithUpload } from 'rizom/types/utility';
	import type { CompiledCollectionConfig } from 'rizom/types/config';

	type Props = {
		form: DocumentFormContext;
		create: boolean;
		accept: WithUpload<CompiledCollectionConfig>['accept'];
	};
	const { form, create, accept }: Props = $props();

	let preview = $state<string | null>(null);
	let file = $state<File | null>(null);
	let isValidFile = $state(false);

	const hasAccept = 'accept' in form.config;
	const allowedMimeTypes = accept || [];

	const deleteFile = () => {
		preview = null;
		file = null;
		form.setValue('file', null);
		form.setValue('filename', null);
		form.setValue('mimeType', null);
		form.setValue('filesize', null);
		form.errors.delete('mimeType');
		form.setValue(`size.thumbnail`, null);
	};

	$effect(() => {
		if (file) {
			const validMimeType =
				!hasAccept || (allowedMimeTypes.length && allowedMimeTypes.includes(file.type));
			if (!validMimeType) {
				const error = `File should be type of ${allowedMimeTypes.join(' | ')}, received ${file.type}`;
				form.errors.set('mimeType', error);
				toast.error(error);
				isValidFile = false;
				file = null;
			} else {
				form.errors.delete('mimeType');
				isValidFile = true;
			}
		}
	});

	$effect(() => {
		if (file && isValidFile && form.doc.filename !== file.name) {
			form.setValue('filename', file.name);
			form.setValue('filesize', util.fileSizeToString(file.size));
			form.setValue('mimeType', file.type);
			form.setValue('file', file);
		}
	});

	$effect(() => {
		if (preview && form.doc.sizes.thumbnail !== preview) {
			form.setValue(`sizes.thumbnail`, preview);
		}
	});

	const mimeTypeToIcon = (type: string) => {
		if (type === 'application/zip') {
			return FileArchive;
		}
		if (type.includes('audio/')) {
			return FileAudio;
		}
		if (type.includes('video/')) {
			return FileVideo;
		}
		return FileText;
	};
</script>

<div class="rz-doc-upload-header">
	{#if form.doc.mimeType}
		<div class="rz-doc-upload-header__file">
			<div class="rz-doc-upload-header__preview">
				{#if form.doc.mimeType.includes('image')}
					<div class="rz-doc-upload-header__prewiew-grid">
						{#key form.doc.title}
							<img src={form.doc.sizes.thumbnail} alt="preview" />
						{/key}
					</div>
				{:else}
					{@const FileIcon = mimeTypeToIcon(form.doc.mimeType)}
					<FileIcon size="40" />
				{/if}
			</div>
			<div class="rz-doc-upload-header__info">
				{#each ['filename', 'filesize', 'mimeType'] as key}
					<h4>{capitalize(key)}</h4>
					{#if !create && key === 'filename'}
						<a target="_blank" href="/medias/{form.doc[key]}">{form.doc[key]}</a>
					{:else}
						<p>{form.doc[key]}</p>
					{/if}
				{/each}
				<Button onclick={deleteFile} size="sm" variant="outline">Delete</Button>
			</div>
		</div>
	{:else}
		<DropZone bind:preview bind:file {accept} />
	{/if}
</div>

<style type="postcss">
	.rz-doc-upload-header {
		container: inline-size;
		padding: 0 var(--rz-fields-padding);
	}

	.rz-doc-upload-header__file {
		border: var(--rz-border);
		overflow: hidden;
		border-radius: var(--radius-md);
	}

	.rz-doc-upload-header__preview {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		width: clamp(var(--rz-size-60), 40vw, 80%);
		max-height: 400px;
		@mixin radius-top md;
	}

	@container (min-width:28rem) {
		.rz-doc-upload-header__file {
			display: flex;
		}
		.rz-doc-upload-header__preview {
			@mixin radius-top none;
			@mixin radius-left md;
		}
		.rz-doc-upload-header__info {
			@mixin px var(--rz-size-8);
		}
	}

	.rz-doc-upload-header__prewiew-grid {
		width: 100%;
		height: 100%;
		--dark: hsl(var(--rz-ground-6) / 1);
		--light: hsl(var(--rz-ground-4) / 1);
		--size: 16px;
		--half-size: calc(var(--size) / 2);
		background-size: var(--size) var(--size);
		background-image: linear-gradient(
				45deg,
				var(--dark) 25%,
				transparent 25%,
				transparent 75%,
				var(--dark) 75%,
				var(--dark)
			),
			linear-gradient(
				45deg,
				var(--dark) 25%,
				transparent 25%,
				transparent 75%,
				var(--dark) 75%,
				var(--dark)
			),
			linear-gradient(
				45deg,
				var(--light) 25%,
				transparent 25%,
				transparent 75%,
				var(--light) 75%,
				var(--light)
			),
			linear-gradient(
				45deg,
				var(--light) 25%,
				transparent 25%,
				transparent 75%,
				var(--light) 75%,
				var(--light)
			);
		background-position:
			0 0,
			var(--half-size) var(--half-size),
			var(--half-size) 0,
			0 var(--half-size);
	}

	.rz-doc-upload-header__prewiew-grid img {
		height: 100%;
		width: 100%;
		object-fit: contain;
	}

	.rz-doc-upload-header__info {
		flex: 1;
		font-size: var(--rz-text-sm);
		@mixin px var(--rz-size-4);
		@mixin py var(--rz-size-4);
	}
	.rz-doc-upload-header__info h4 {
		@mixin font-bold;
		font-size: var(--rz-text-xs);
	}
	.rz-doc-upload-header__info a {
		color: hsl(var(--rz-color-primary));
		margin-bottom: var(--rz-size-3);
		display: block;
		text-decoration: underline;
	}
	.rz-doc-upload-header__info p {
		margin-bottom: var(--rz-size-3);
	}
</style>
