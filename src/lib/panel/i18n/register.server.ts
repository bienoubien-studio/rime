import { PACKAGE_NAME } from 'rizom/constant';
import { namespaces, type Dictionaries, type PanelLanguage } from './index.js';

export async function registerTranslation(locale: PanelLanguage) {
	const dictionaries: Partial<Dictionaries> = {};
	try {
		for (const namespace of namespaces) {
			const isPackageDev = process.env.RIZOM_ENV === 'package';
			const pathToTranslation = isPackageDev
				? `../i18n/${locale}/${namespace}.js`
				: `${PACKAGE_NAME}/panel/i18n/${locale}/${namespace}.js`;
			dictionaries[namespace] = (await import(/* @vite-ignore */ pathToTranslation)).default;
		}
	} catch (error) {
		console.error(`Failed to load translations:`, error);
	}
	return dictionaries;
}
