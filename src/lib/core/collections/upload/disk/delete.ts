import { existsSync, unlink, unlinkSync } from 'fs';
import path from 'path';
import type { GenericDoc } from '$lib/core/types/doc';
import type { CompiledCollection } from '$lib/core/config/types';
import type { WithUpload } from '$lib/util/types';
import type { LocalAPI } from '$lib/core/operations/local-api.server';
import { logger } from '$lib/core/logger/index.server';

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
			Object.values(doc.sizes).forEach((path) => {
				if (typeof path === 'string') {
					unlinkPath(`static/${path}`);
				}
			});
		}
	} catch (err: any) {
		logger.error(err);
	}
	return doc;
};
