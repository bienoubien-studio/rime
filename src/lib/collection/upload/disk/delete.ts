import { existsSync, unlink, unlinkSync } from 'fs';
import { toCamelCase } from '$lib/utils/string.js';
import path from 'path';
import type { GenericDoc, UploadDoc } from 'rizom/types/doc';
import type { BuiltUploadCollectionConfig } from 'rizom/types/config';
import type { LocalAPI } from 'rizom/types/api';

type Args = {
	config: BuiltUploadCollectionConfig;
	api: LocalAPI;
	id: string;
};

export const cleanupStoredFiles = async ({ config, api, id }: Args): Promise<GenericDoc> => {
	const doc = (await api.collection(config.slug).findById({ id })) as UploadDoc;

	try {
		const filePath = path.resolve(process.cwd(), `static/medias/${doc.filename}`);
		unlinkSync(filePath);
		for (const size of config.imageSizes || []) {
			const sizeKey = toCamelCase(size.name);
			const sizePath = `static/${doc[sizeKey]}`;
			if (existsSync(sizePath)) {
				unlink(sizePath, () => {});
			}
		}
	} catch (err: any) {
		console.log('Error while deleting files ' + err.message);
	}
	return doc;
};
