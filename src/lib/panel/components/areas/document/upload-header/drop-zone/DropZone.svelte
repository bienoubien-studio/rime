<script lang="ts">
	import { t__ } from 'rizom/panel/i18n/index.js';
	import type { CollectionConfig } from 'rizom/types';
	import type { WithUpload } from 'rizom/types/utility';

	import type { ChangeEventHandler } from 'svelte/elements';

	type Props = {
		accept: WithUpload<CollectionConfig>['accept'] | undefined;
		preview: string | null;
		file: File | null;
	};

	let { preview = $bindable(), file = $bindable(), accept }: Props = $props();

	let input: HTMLInputElement;
	let dragOver = $state(false);

	const handleDragOver = (event: DragEvent) => {
		dragOver = true;
		event.preventDefault();
	};

	const handleDragLeave = (event: DragEvent) => {
		dragOver = false;
		event.preventDefault();
	};

	const handleChange: ChangeEventHandler<HTMLInputElement> = () => {
		const files = input.files;
		if (files && files.length) {
			processFile(files[0]);
		}
	};

	const handleDrop = (event: DragEvent) => {
		dragOver = false;
		event.preventDefault();

		if ('dataTransfer' in event && event.dataTransfer && event.dataTransfer.files) {
			const droppedFiles = Array.from(event.dataTransfer.files);

			processFile(droppedFiles[0]);
		}
	};

	const processFile = (value: File) => {
		const reader = new FileReader();

		reader.onloadend = () => {
			preview = typeof reader.result === 'string' ? reader.result : null;
			file = value;
		};

		reader.onerror = () => {
			console.error('There was an issue reading the file.');
		};

		reader.readAsDataURL(value);
	};

	const dragOverClassModifier = $derived(dragOver ? 'rz-doc-upload-dropzone--dragover' : '');
</script>

<label
	for="file"
	class="rz-doc-upload-dropzone {dragOverClassModifier}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<p>{t__('common.drop_file')} {t__('common.or')} <strong>{t__('common.browse')}</strong></p>
	{#if accept}
		<p class="rz-doc-upload-dropzone__accept">{accept.join(', ')} accepted</p>
	{/if}

	<input
		bind:this={input}
		onchange={handleChange}
		id="file"
		name="file"
		type="file"
		placeholder="upload"
	/>
</label>

<style type="postcss">
	.rz-doc-upload-dropzone {
		display: grid;
		cursor: pointer;
		height: var(--rz-size-32);
		place-content: center;
		border-radius: var(--rz-radius-lg);
		border: 2px dashed hsl(var(--rz-ground-3) / 1);
		background: transparent;
		text-align: center;
		font-size: var(--rz-text-sm);
	}

	.rz-doc-upload-dropzone:focus-visible {
		outline: none;
		--ring-offset: 1px;
		@mixin ring var(--rz-color-ring);
	}

	.rz-doc-upload-dropzone--dragover {
		border-color: hsl(var(--rz-color-ring) / 1);
	}

	.rz-doc-upload-dropzone input {
		display: none;
	}
	.rz-doc-upload-dropzone__accept {
		opacity: 0.5;
		font-size: var(--rz-text-xs);
	}
</style>
