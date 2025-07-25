import type { CompiledCollection } from '$lib/core/config/types';
import { logger } from '$lib/core/logger/index.server';
import type { Rizom } from '$lib/core/rizom.server';
import type { GenericDoc } from '$lib/core/types/doc';
import type { WithUpload } from '$lib/util/types';
import { existsSync, unlink, unlinkSync } from 'fs';
import path from 'path';

type Args = {
	config: WithUpload<CompiledCollection>;
	rizom: Rizom;
	id: string;
};

export const cleanupStoredFiles = async ({ config, rizom, id }: Args): Promise<GenericDoc> => {
	const doc = await rizom.collection<any>(config.slug).findById({ id, draft: true });

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
