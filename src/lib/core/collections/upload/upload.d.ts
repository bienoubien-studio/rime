import type { UploadPath } from './util/path.js';

export type JsonFile = {
	base64: string;
	filename?: string;
	mimeType?: string;
	filesize?: number;
	lastModified?: number;
};

export type Directory = {
	id: UploadPath;
	name: string;
	parent: UploadPath | null;
};
