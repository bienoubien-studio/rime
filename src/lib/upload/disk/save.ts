import type { ImageSizesConfig } from 'rizom/types/config';
import type { UploadDoc } from 'rizom';
import path from 'path';
import { existsSync, writeFileSync } from 'fs';
import { randomId } from 'rizom/utils/random';
import { RizomUploadError } from 'rizom/errors/upload';
import { pick } from 'rizom/utils/object';
import sharp from 'sharp';
import { toCamelCase } from 'rizom/utils/string';
import { normalizeFileName } from 'rizom/utils/file';
import type { Dic } from 'rizom/types/utility';

export const saveFile = async (file: File, imagesSizes: ImageSizesConfig[] | false) => {
	const { name: initialName, extension } = normalizeFileName(file.name);
	let name = initialName;
	let sizes: UploadDoc['sizes'];
	let filename = `${name}.${extension}`;
	let filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
	while (existsSync(filePath)) {
		name += `-${randomId(8)}`;
		filename = `${name}.${extension}`;
		filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		writeFileSync(filePath, buffer);
		if (imagesSizes && file.type.includes('image')) {
			sizes = await generateSizes({
				name: name,
				extension,
				sizes: imagesSizes,
				buffer
			});
		}
	} catch (err: any) {
		console.log(err);
		throw new RizomUploadError('Error while writing file on disk');
	}
	return { filename, imageSizes: sizes };
};

type GenerateSizeArgs = {
	sizes: ImageSizesConfig[];
	buffer: Buffer;
	name: string;
	extension: string;
};

export const generateSizes = async ({ sizes, buffer, name, extension }: GenerateSizeArgs) => {
	const imageSizes: Dic = {};
	for (const size of sizes) {
		const wh = pick(['width', 'height'], size);
		const resizedBuffer = await sharp(buffer).resize(wh).toBuffer();
		const whString = `${wh.width || ''}${wh.height && wh.width ? 'x' : ''}${wh.height || ''}`;
		const filename = `${name}-${toCamelCase(size.name)}-${whString}.${extension}`;
		const filePath = path.resolve(process.cwd(), `static/medias/${filename}`);
		writeFileSync(filePath, resizedBuffer);
		imageSizes[toCamelCase(size.name)] = filename;
	}
	return imageSizes;
};
