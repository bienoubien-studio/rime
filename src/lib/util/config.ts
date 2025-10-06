/**
 * Utility function to includes a module with internals imports in the config.
 * The browser config is re-writed and sanitized, that way imports of external modules can be tracked
 * like for example a tiptap extensions
 * @example
 *
 * // src/config/lorem-feature.ts
 * const LoremFeature = {
 *   name: 'lorem-fill',
 *   marks: [fillWithLorem]
 * };
 *
 * export default external(LoremFeature, import.meta.url);
 *
 * // src/config/rime.config.ts
 * import loremFeature from './lorem-feature.ts'
 * const writer = richText('writer').features('bold', loremFeature)
 */
export function external<T>(module: T, path: string, exportName: string = 'default'): T {
	Object.defineProperty(module, Symbol.for('external'), {
		value: { path, exportName },
		enumerable: false
	});
	return module;
}
