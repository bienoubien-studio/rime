import { existsSync, unlink, unlinkSync } from 'fs';
import { toCamelCase } from '$lib/utils/string.js';
import path from 'path';
import type { GenericDoc, UploadDoc } from 'rizom/types/doc';
import type { LocalAPI } from 'rizom/types/api';
import type { CompiledCollectionConfig } from 'rizom/types/config';
import type { WithUpload } from 'rizom/types/utility';

type Args = {
	config: WithUpload<CompiledCollectionConfig>;
	api: LocalAPI;
	id: string;
};

export const cleanupStoredFiles = async ({ config, api, id }: Args): Promise<GenericDoc> => {
	const doc = (await api.collection(config.slug).findById({ id }))! as UploadDoc;

	try {
		const filePath = path.resolve(process.cwd(), `static/medias/${doc.filename}`);
		unlinkSync(filePath);
		for (const size of config.imageSizes || []) {
			const unlinkPath = (sizePath: string) => {
				if (existsSync(sizePath)) {
					unlink(sizePath, () => {});
				}
			};
			const sizeKey = toCamelCase(size.name);
			if (typeof doc.size[sizeKey] === 'string') {
				unlinkPath(`static/${doc.size[sizeKey]}`);
			} else {
				for (const sizeFormatPath of Object.values(doc.size[sizeKey])) {
					unlinkPath(`static/${sizeFormatPath}`);
				}
			}
		}
	} catch (err: any) {
		console.log('Error while deleting files ' + err.message);
	}
	return doc;
};
