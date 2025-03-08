import { getExtensionFromMimeType, getMimeTypeFromExtension } from '../util/mime.js';
import type { JsonFile } from 'rizom/types/upload';
import { readFile } from 'fs/promises';
import { fileSizeToString } from 'rizom/util/file.js';
import { RizomError } from 'rizom/errors/index.js';

export const jsonFileToFile = (jsonFile: JsonFile) => {
	// Convert base64 to Blob
	const base64String = jsonFile.base64;
	// Extract the actual base64 content after the data URI prefix
	const base64Content = base64String.split(',')[1];

	if (!base64Content) {
		throw new RizomError(RizomError.UPLOAD, 'Invalid base64 data format');
	}

	try {
		const byteCharacters = atob(base64Content);
		const byteNumbers = new Array(byteCharacters.length);

		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);

		// Guess file type if not provided
		let mimeType = jsonFile.mimeType;
		if (!mimeType) {
			const base64Header = base64String.split(';')[0].split(':')[1];
			if (base64Header) {
				mimeType = base64Header;
			} else {
				mimeType = 'application/octet-stream';
			}
		}

		const extension = getExtensionFromMimeType(mimeType);
		if (!extension) {
			throw new RizomError(RizomError.UPLOAD, 'File type not supported');
		}

		const blob = new Blob([byteArray], { type: mimeType });

		const filename = jsonFile.filename || `file-${Date.now()}.${extension}`;
		const lastModified = jsonFile.lastModified || Date.now();
		const filesize = fileSizeToString(jsonFile.filesize || blob.size);

		return {
			filename,
			mimeType,
			filesize,
			file: new File([blob], filename, {
				type: mimeType,
				lastModified: lastModified
			})
		};
	} catch (error: any) {
		throw new RizomError(RizomError.UPLOAD, 'Invalid base64 content');
	}
};

export async function filePathToBase64(filePath: string): Promise<string> {
	try {
		const data = await readFile(filePath);
		const ext = filePath.split('.').pop()?.toLowerCase() || '';
		const mimeType = getMimeTypeFromExtension(ext);
		if (!mimeType) {
			throw new Error(`Unsupported file extension: ${ext}`);
		}
		const base64 = data.toString('base64');
		return `data:${mimeType};base64,${base64}`;
	} catch (error) {
		console.error('Error:', error);
		throw error;
	}
}
