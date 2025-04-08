import { existsSync, unlink, unlinkSync } from 'fs';
import { toCamelCase } from '$lib/util/string.js';
import path from 'path';
import type { GenericDoc } from 'rizom/types/doc';
import type { CompiledCollection } from 'rizom/types/config';
import type { WithUpload } from 'rizom/types/util';
import type { LocalAPI } from 'rizom/operations/localAPI/index.server';
import { logger } from 'rizom/util/logger/index.server';

type Args = {
	config: WithUpload<CompiledCollection>;
	api: LocalAPI;
	id: string;
};

export const cleanupStoredFiles = async ({ config, api, id }: Args): Promise<GenericDoc> => {
	const doc = await api.collection<any>(config.slug).findById({ id });

	try {
		const filePath = path.resolve(process.cwd(), `static/medias/${doc.filename}`);
		
		// Delete original
		unlinkSync(filePath);
		
		const unlinkPath = (sizePath: string) => {
			if (existsSync(sizePath)) {
				unlink(sizePath, () => {});
			}
		};
		
		// Process all entries in doc.sizes
		if (doc.sizes) {
			Object.values(doc.sizes).forEach(path => {
				if (typeof path === 'string') {
					unlinkPath(`static/${path}`);
				}
			});
		}
	} catch (err: any) {
		logger.error(err)
	}
	return doc;
};
