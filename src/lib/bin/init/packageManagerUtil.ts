import { existsSync } from 'fs';
import path from 'path';

const packageManagersMap = {
	yarn: 'yarn.lock',
	pnpm: 'pnpm-lock.yaml',
	bun: 'bun.lockb',
	npm: 'package-lock.json'
};

const packageManagerInstallMap = {
	yarn: 'yarn add',
	pnpm: 'pnpm add',
	bun: 'bun add',
	npm: 'npm install'
};

type PackageManagerName = keyof typeof packageManagerInstallMap;

export const getPackageManager = (): PackageManagerName => {
	for (const [packageManager, lockFile] of Object.entries(packageManagersMap)) {
		const pathToLockFile = path.resolve(process.cwd(), lockFile);
		if (existsSync(pathToLockFile)) {
			return packageManager as PackageManagerName;
		}
	}
	return 'npm';
};

export const getInstallCommand = (packageManager: PackageManagerName) => {
	return packageManagerInstallMap[packageManager];
};
