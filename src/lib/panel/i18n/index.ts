const languages = ['fr', 'en'] as const;
const namespaces = ['errors', 'fields', 'common'] as const;
const DEFAULT_LOCALE = 'en';

export type PanelLanguage = (typeof languages)[number];
type Namespace = (typeof namespaces)[number];
type Dictionaries = Record<Namespace, Record<string, string>>;

// Template cache for better performance
const templateCache = new Map<string, (gender?: string, plural?: string) => string>();

function compileTemplate(text: string) {
	if (templateCache.has(text)) {
		return templateCache.get(text)!;
	}

	const compiled = (gender?: string, plural?: string) => {
		return text.replace(/\{([^}]+)\}/g, (_, options) => {
			const variants = options.split('|');
			if (gender === 'f') {
				if (plural) return variants[3]?.trim() || variants[0].trim();
				return variants[1]?.trim() || variants[0].trim();
			}
			if (plural) return variants[2]?.trim() || variants[0].trim();
			return variants[0].trim();
		});
	};

	templateCache.set(text, compiled);
	return compiled;
}

const loaders = languages.flatMap((locale) =>
	namespaces.map((namespace) => ({
		locale,
		namespace,
		loader: async () => (await import(`./${locale}/${namespace}.js`)).default
	}))
);

let dictionaries: Partial<Dictionaries> = {};
let fallbackDictionaries: Partial<Dictionaries> = {};

export async function registerTranslation(locale: PanelLanguage) {
	try {
		for (const { locale: l, namespace, loader } of loaders) {
			if (l === locale) {
				dictionaries[namespace] = await loader();
			}
			if (l === DEFAULT_LOCALE) {
				fallbackDictionaries[namespace] = await loader();
			}
		}
	} catch (error) {
		console.error(`Failed to load translations:`, error);
	}
}

type TranslationKey = `${Namespace}.${string}`;
type ModifiedKey = `${TranslationKey}|${'m' | 'f'}` | `${TranslationKey}|${'m' | 'f'}|p`;

/**
 * Translates a key with optional gender and plural modifiers
 *
 * @param key - Translation key in format: "namespace.key|gender|plural"
 *   - namespace: The translation namespace (e.g., "common", "errors")
 *   - key: The translation key
 *   - gender: Optional 'm' or 'f' modifier
 *   - plural: Optional 'p' modifier for plural
 * @param params - Optional parameters to replace $1, $2, etc. in the translation
 *
 * @example
 * // Basic usage
 * t__('common.save')  // → "Save"
 *
 * // With gender (masculine/feminine)
 * t__('common.new|m')  // → "nouveau"
 * t__('common.new|f')  // → "nouvelle"
 *
 * // With plural
 * t__('common.new|m|p')  // → "nouveaux"
 * t__('common.new|f|p')  // → "nouvelles"
 *
 * // With parameters
 * t__('common.count', '42')  // → "Count: 42" (if template is "Count: $1")
 *
 * // Translation templates in JSON should use this format:
 * // {masculine|feminine|masculine_plural|feminine_plural}
 * // "new": "{nouveau|nouvelle|nouveaux|nouvelles}"
 * // "create": "Créer {un|une|des} {nouveau|nouvelle|nouveaux|nouvelles} élément{ | |s}"
 */
export function t__(key: TranslationKey | ModifiedKey | string, ...params: string[]) {
	const isPredefinedError = namespaces.some((ns) => key.startsWith(`${ns}.`));

	if (!isPredefinedError) {
		return key; // Return custom message as-is
	}

	const [baseKey, gender, plural] = key.split('|');
	const [namespace, translationKey] = baseKey.split('.') as [Namespace, string];

	if (!dictionaries[namespace]) {
		console.warn(`Namespace ${namespace} not loaded`);
	}

	const text =
		dictionaries[namespace]?.[translationKey] ??
		fallbackDictionaries[namespace]?.[translationKey] ??
		key;

	// Use compiled template
	const compiled = compileTemplate(text);
	const resolved = compiled(gender, plural);

	// Handle parameter replacements
	return resolved.replace(/\$(\d+)/g, (_, index) => params[index - 1] ?? '');
}
