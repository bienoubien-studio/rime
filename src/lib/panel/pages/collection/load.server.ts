import { makeUploadDirectoriesSlug } from '$lib/adapter-sqlite/generate-schema/util.js';
import { UPLOAD_PATH } from '$lib/core/constant.js';
import type { CollectionSlug, GenericDoc } from '$lib/core/types/doc.js';
import type { Route } from '$lib/panel/types.js';
import { redirect, type ServerLoadEvent } from '@sveltejs/kit';

import type { Directory } from '$lib/core/collections/upload/upload.js';
import {
	buildUploadAria,
	getParentPath,
	removePathFromLastAria,
	type UploadPath
} from '$lib/core/collections/upload/util/path.js';
import { handleError } from '$lib/core/errors/handler.server.js';
import { logger } from '$lib/core/logger/index.server.js';
import { trycatch } from '$lib/util/function.js';

type Data = {
	aria: Partial<Route>[];
	docs: GenericDoc[];
	canCreate: boolean;
	status: number;
	upload?: { directories: Directory[]; currentPath: UploadPath; parentDirectory: Directory };
};

/****************************************************
/* Layout load
/****************************************************/

export function collectionLoad(slug: CollectionSlug) {
	//
	const load = async (event: ServerLoadEvent): Promise<Data> => {
		const { rizom, locale, user } = event.locals;

		const collection = rizom.collection(slug);
		const authorizedCreate = collection.config.access.create(user, {});

		const docs = await collection.find({
			locale,
			draft: true
		});

		let aria: Partial<Route>[] = [{ title: 'Dashboard', path: `/panel` }, { title: collection.config.label.plural }];

		let data: Data = {
			aria,
			docs,
			canCreate: authorizedCreate,
			status: 200
		};

		if (collection.config.upload) {
			let directories: any[] = [];
			const paramUploadPath = event.url.searchParams.get('uploadPath') as UploadPath | null;
			const currentDirectoryPath = paramUploadPath || UPLOAD_PATH.ROOT_NAME;
			const directoryCollection = rizom.collection<any>(makeUploadDirectoriesSlug(slug));
			// Check if dir exists
			let [error, currentDirectory] = await trycatch(() =>
				directoryCollection.findById({
					id: currentDirectoryPath
				})
			);

			// If doesn't exists and path is root then create it
			if (!currentDirectory && currentDirectoryPath === UPLOAD_PATH.ROOT_NAME) {
				await directoryCollection.create({
					data: { id: UPLOAD_PATH.ROOT_NAME }
				});
			} else if (error) {
				logger.error(`${paramUploadPath} doesn't exists`);
				return redirect(301, event.url.pathname);
			}

			directories = await directoryCollection.find({
				query: `where[parent][equals]=${currentDirectoryPath}`,
				sort: 'name'
			});

			const parentPath = getParentPath(currentDirectoryPath);
			let parentDirectory;

			if (parentPath) {
				const [parentError, result] = await trycatch(() =>
					directoryCollection.findById({
						id: parentPath
					})
				);

				if (parentError) {
					throw handleError(parentError, { context: 'load' });
				}
				parentDirectory = result;

				const collectionAria = { title: collection.config.label.plural, path: `/panel/${collection.config.slug}` };
				aria = [...aria].slice(0, -1);
				aria = [...aria, collectionAria, ...buildUploadAria({ path: currentDirectoryPath, slug })];
				data.aria = removePathFromLastAria(aria);
			}

			data = { ...data, upload: { directories, currentPath: currentDirectoryPath, parentDirectory } };
		}

		return data;
	};
	return load;
}
