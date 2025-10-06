import type { CompiledCollection } from '$lib/core/config/types.js';
import { logger } from '$lib/core/logger/index.server.js';
import type { Rime } from '$lib/core/rime.server.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import { existsSync, unlink, unlinkSync } from 'fs';
import path from 'path';
import type { WithUpload } from '../util/config.js';

type Args = {
	config: WithUpload<CompiledCollection>;
	rime: Rime;
	id: string;
};

export const cleanupStoredFiles = async ({ config, rime, id }: Args): Promise<GenericDoc> => {
	const doc = await rime.collection<any>(config.slug).findById({ id, draft: true });

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
