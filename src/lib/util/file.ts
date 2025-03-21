import { slugify } from '$lib/util/string.js';
import { FileArchive, FileAudio, FileText, FileVideo } from '@lucide/svelte';

export const fileSizeToString = (size: number) => {
	if (size < 1_000_000) {
		return (size / 1_000).toFixed(2) + 'KB';
	} else {
		return (size / 1_000_000).toFixed(2) + 'MB';
	}
};

export const normalizeFileName = (str: string) => {
	const { name, extension } = fileNameAndExt(str);
	const normalizedName = slugify(name);
	const normalizedExtension = extension.toLowerCase().replace('jpeg', 'jpg');
	return {
		name: normalizedName,
		extension: normalizedExtension
	};
};

export function isFile(file: any): file is File {
	return file instanceof File;
}

export const fileNameAndExt = (filename: string) => {
	return {
		name: filename.substring(0, filename.lastIndexOf('.')),
		extension: filename.substring(filename.lastIndexOf('.') + 1, filename.length).toLowerCase()
	};
};

export const mimeTypeToIcon = (type: string) => {
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