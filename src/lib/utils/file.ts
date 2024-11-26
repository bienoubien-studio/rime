import { slugify } from '$lib/utils/string.js';

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
	return {
		name: normalizedName,
		extension
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
