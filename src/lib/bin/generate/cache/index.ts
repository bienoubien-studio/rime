import fs from 'fs';
import path from 'path';

const cachePath = path.resolve(process.cwd(), '.rizom');
if (!fs.existsSync(cachePath)) {
	fs.mkdirSync(cachePath);
}

function get(key: string): string | false {
	const keyPath = path.join(cachePath, key + '.txt');
	const exist = fs.existsSync(keyPath);
	if (exist) {
		return fs.readFileSync(keyPath).toString();
	}
	return false;
}

function set(key: string, value: string) {
	if (!fs.existsSync(cachePath)) {
		fs.mkdirSync(cachePath);
	}
	const keyPath = path.join(cachePath, key + '.txt');
	fs.writeFileSync(keyPath, value);
}

function del(key: string) {
	const keyPath = path.join(cachePath, key + '.txt');
	if (fs.existsSync(keyPath)) {
		fs.rmSync(keyPath);
	}
}

function clear() {
	fs.rmSync(cachePath, { recursive: true });
}

export default {
	get,
	set,
	clear,
	delete: del
};
