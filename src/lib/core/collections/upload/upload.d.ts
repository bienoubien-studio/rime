export type JsonFile = {
	base64: string;
	filename?: string;
	mimeType?: string;
	filesize?: number;
	lastModified?: number;
};

export type Directory = {
	id: `root${string}`
	name: string,
	parent: string | null
}