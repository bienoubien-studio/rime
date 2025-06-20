import { redirect, type ServerLoad } from '@sveltejs/kit';
import type { CollectionSlug } from '$lib/core/types/doc.js';
import type { Route } from '$lib/panel/types.js';
import type { WithRequired } from 'better-auth/svelte';
import { UPLOAD_PATH } from '$lib/core/constant.js';
import { makeUploadDirectoriesSlug } from '$lib/util/schema.js';
import type { Dic } from '$lib/util/types.js';
import { buildUploadAria, getParentPath, type UploadPath } from '$lib/core/collections/upload/util/path.js';
import { logger } from '$lib/core/logger/index.server.js';
import { trycatch } from '$lib/util/trycatch.js';

/****************************************************/
/* Layout load
/****************************************************/
export function collectionLoad(slug: CollectionSlug) {
	//
	const load: ServerLoad = async (event) => {
		const { rizom, locale, user } = event.locals;

		event.depends('data:currentPath');
		const collection = rizom.collection(slug);
		const authorizedCreate = collection.config.access.create(user, {});

		const docs = await collection.find({
			locale,
			draft: true
		});

		let aria: WithRequired<Partial<Route>, 'title'>[] = [
			{ title: 'Dashboard', path: `/panel` },
			{ title: collection.config.label.plural }
		];

		let data: Dic = {
			aria,
			docs,
			canCreate: authorizedCreate,
			slug,
			status: 200
		};

		if (collection.config.upload) {
			let directories: any[] = [];
			const paramUploadPath = event.url.searchParams.get('uploadPath') as UploadPath | null;
			const currentDirectoryPath = paramUploadPath || UPLOAD_PATH.ROOT_NAME;
			const directoryCollection = rizom.collection(makeUploadDirectoriesSlug(slug));
			// Check if dir exists
			let [_, currentDirectory] = await trycatch(directoryCollection.findById({
				id: currentDirectoryPath
			}));
			// If doesn't exists and path is root then create it
			if (!currentDirectory && currentDirectoryPath === UPLOAD_PATH.ROOT_NAME) {
				await directoryCollection.create({
					data: { id: UPLOAD_PATH.ROOT_NAME }
				});
			}
			if(!currentDirectory){
				logger.error(`${paramUploadPath} doesn't exists`)
				return redirect(301, event.url.pathname)
			}
			directories = await directoryCollection.find({
				query: `where[parent][equals]=${currentDirectoryPath}`
			});

			const parentPath = getParentPath(currentDirectoryPath);
			let parentDirectory;

			if (parentPath) {
				parentDirectory = await directoryCollection.findById({
					id: parentPath
				});
				const collectionAria = { title: collection.config.label.plural, path: `/panel/${collection.config.slug}` }
				aria = [...aria].slice(0, -1);
				aria = [...aria, collectionAria, ...buildUploadAria({ path: currentDirectoryPath, slug })];
				data.aria = aria
			}

			data = { ...data, upload: { directories, currentPath: currentDirectoryPath, parentDirectory } };
		}

		return data;
	};
	return load;
}
