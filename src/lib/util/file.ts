import { slugify } from '$lib/util/string.js';

/**
 * Converts a file size in bytes to a human-readable string format
 * @param size The file size in bytes
 * @returns A formatted string with KB or MB units
 * @example
 * fileSizeToString(500) // returns "0.50KB"
 * fileSizeToString(1500000) // returns "1.50MB"
 */
export const fileSizeToString = (size: number) => {
	if (size < 1_000_000) {
		return (size / 1_000).toFixed(2) + 'KB';
	} else {
		return (size / 1_000_000).toFixed(2) + 'MB';
	}
};

/**
 * Normalizes a filename by slugifying the name and standardizing the extension
 * @param filename The original filename including extension
 * @example
 * normalizeFileName("My Photo.JPEG") // returns { name: "my-photo", extension: "jpg" }
 * normalizeFileName("Document 1.PDF") // returns { name: "document-1", extension: "pdf" }
 */
export const normalizeFileName = (filename: string) => {
	const { name, extension } = fileNameAndExt(filename);
	const normalizedName = slugify(name);
	const normalizedExtension = extension.toLowerCase().replace('jpeg', 'jpg');
	return {
		name: normalizedName,
		extension: normalizedExtension
	};
};

/**
 * Type guard to check if a value is a File object
 * @param file The value to check
 * @returns Boolean indicating if the value is a File
 */
export function isFile(file: any): file is File {
	return file instanceof File;
}

/**
 * Splits a filename into its name and extension parts
 * @param filename The full filename including extension
 * @example
 * fileNameAndExt("document.pdf") // returns { name: "document", extension: "pdf" }
 * fileNameAndExt("image.with.dots.jpg") // returns { name: "image.with.dots", extension: "jpg" }
 */
export const fileNameAndExt = (filename: string) => {
	return {
		name: filename.substring(0, filename.lastIndexOf('.')),
		extension: filename.substring(filename.lastIndexOf('.') + 1, filename.length).toLowerCase()
	};
};
