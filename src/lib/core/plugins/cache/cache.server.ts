import fs from 'fs';
import path from 'path';
import { logger } from '$lib/core/logger/index.server';

const cachePath = path.resolve(process.cwd(), '.cache');
if (!fs.existsSync(cachePath)) {
	fs.mkdirSync(cachePath);
}

export class Cache {
	//
	static async get<T>(key: string, loadData: any): Promise<T> {
		const keyPath = path.join(cachePath, key + '.txt');
		const exist = fs.existsSync(keyPath);

		const setAndReturn = async () => {
			const data = await loadData();
			Cache.set(key, JSON.stringify(data));
			return data;
		};

		if (exist) {
			const data = fs.readFileSync(keyPath).toString();
			try {
				return JSON.parse(data);
			} catch (err: any) {
				logger.error(err);
				return setAndReturn();
			}
		}
		return setAndReturn();
	}

	static set(key: string, value: string) {
		const keyPath = path.join(cachePath, key + '.txt');
		fs.writeFileSync(keyPath, value);
	}

	static delete(key: string) {
		const keyPath = path.join(cachePath, key + '.txt');
		if (fs.existsSync(keyPath)) {
			fs.rmSync(keyPath);
		}
	}

	static clear() {
		fs.rmSync(cachePath, { recursive: true });
		fs.mkdirSync(cachePath);
	}
}
