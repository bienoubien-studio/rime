import type { BlockStatement, Node } from '@babel/types';
import * as t from '@babel/types';
import { babelParse, getLang, walkASTAsync } from 'ast-kit';
import fs from 'fs';
import { generateTransform, MagicStringAST, type CodeTransform } from 'magic-string-ast';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';
import type { NodeRef, Transformer, TransformerParsed } from './types';

export function sanitize(): Plugin {
	const virtualModuleId = 'virtual:rizom.config';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	let server: ViteDevServer;

	return {
		name: '$rizom/config',

		enforce: 'pre',

		configureServer(_server) {
			server = _server;
		},

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			if (id === '$rizom/config') {
				return this.environment?.config?.consumer === 'server'
					? 'src/lib/core/config/build/index.server.js'
					: 'src/lib/core/config/build/index.js';
			}
		},

		load(id) {
			if (id === resolvedVirtualModuleId) {
				const configPath = path.resolve(process.cwd(), 'src/config/rizom.config.ts');
				const code = fs.readFileSync(configPath, 'utf-8');
				console.log(code);
				return code;
			}
			// const isSSR = this.environment.config.consumer === 'server';
			// if (!isSSR && id.includes('rizom.config')) {
			// 	const configPath = path.resolve(process.cwd(), 'src/' + id.replace('.js', '.ts'));
			// 	const code = fs.readFileSync(configPath, 'utf-8');
			// 	console.log(code);
			// 	return code;
			// 	// console.log(server.moduleGraph.getModuleById(id))
			// }
		},

		async transform(code, id) {
			// return code
			if (id === resolvedVirtualModuleId) {
				const sanitized = await sanitizeFunction(code, id);
				console.log(sanitized);
				return sanitized?.code || '';
			}
		}
	};
}

export function useNodeRef(): {
	nodeRefs: Map<Node, NodeRef<Node | undefined>>;
	getNodeRef: (node: Node) => NodeRef<Node | undefined>;
} {
	const nodeRefs: Map<Node, NodeRef<Node | undefined>> = new Map();

	function getNodeRef(node: Node): NodeRef<Node | undefined> {
		if (nodeRefs.has(node)) return nodeRefs.get(node)!;
		const ref: NodeRef<Node | undefined> = {
			value: node,
			set(node) {
				this.value = node;
			}
		};
		nodeRefs.set(node, ref);
		return ref;
	}

	return {
		nodeRefs,
		getNodeRef
	};
}

export async function sanitizeFunction(code: string, id: string): Promise<CodeTransform | undefined> {
	const { getNodeRef } = useNodeRef();

	const transformers: TransformerParsed[] = [{ transformer: SanitizeTransformer(), nodes: [] }];

	const parseOptions = {
		sourceType: 'module'
	};

	const program = babelParse(code, 'ts', parseOptions);

	await walkASTAsync(program, {
		async enter(node, parent, key, index) {
			for (const { transformer, nodes } of transformers) {
				if (transformer.onNode) {
					const bool = await transformer.onNode?.(node, parent, index);
					if (!bool) continue;
				}
				nodes.push(getNodeRef(node));
			}
		}
	});

	const s = new MagicStringAST(code);
	for (const { transformer, nodes } of transformers) {
		for (const node of nodes) {
			const value = node.value;
			if (!value) continue;
			const result = await transformer.transform(value, code, { id });

			if (result) {
				let newAST: Node;
				if (typeof result === 'string') {
					s.overwriteNode(value, result);
					newAST = (babelParse(`{${result}}`, getLang(id), parseOptions).body[0] as BlockStatement).body[0];
					if (newAST.type === 'ExpressionStatement') {
						newAST = newAST.expression;
					}
					newAST.start = value.start!;
					newAST.end = value.end!;
				} else {
					// @ts-expect-error no types for '@babel/generator'
					let { default: generate } = await import('@babel/generator');
					generate = (generate.default as undefined) || generate;
					const generated = generate(result);
					let code = generated.code;
					if (result.type.endsWith('Expression')) code = `(${code})`;
					s.overwriteNode(value, code);
					newAST = result;
				}

				node.set(newAST);
			} else if (result === false) {
				// removes node
				node.set(undefined);
				s.removeNode(value);
			}
		}
	}

	for (const { transformer } of transformers) {
		await transformer.finalize?.(s);
	}

	return generateTransform(s, id);
}

const excludePatterns = [
	'^trustedOrigins$',
	'^database$',
	'^smtp$',
	'^routes$',
	'^plugins$',
	'^cache',
	'^panel\\.access',
	'^panel\\.routes',
	'^panel\\.users',
	'^collections\\[n\\]\\.hooks',
	'^areas\\[n\\]\\.hooks',
	'fields\\[n\\]\\.hooks\\.beforeValidate',
	'fields\\[n\\]\\.hooks\\.beforeSave',
	'fields\\[n\\]\\.hooks\\.beforeRead',
	'.*\\.server$'
].map((p) => new RegExp(p));

function shouldExclude(path: string): boolean {
	return excludePatterns.some((rx) => rx.test(path));
}

function sanitizeNode(node: t.Node, path: string[] = []): t.Node | null {
	if (t.isObjectExpression(node)) {
		const newProperties = node.properties
			.map((prop) => {
				if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
					const key = prop.key.name;
					const newPath = [...path, key];
					const pathStr = newPath.join('.');

					if (shouldExclude(pathStr)) {
						return null; // remove this property entirely
					}

					// recurse into nested values
					let newValue = prop.value;
					if (t.isObjectExpression(prop.value) || t.isArrayExpression(prop.value)) {
						const sanitized = sanitizeNode(prop.value, newPath);
						if (!sanitized) return null;
						newValue = sanitized as any;
					}
					return t.objectProperty(prop.key, newValue, prop.computed, prop.shorthand, prop.decorators);
				}
				return prop;
			})
			.filter(Boolean) as (t.ObjectProperty | t.SpreadElement)[];
		return t.objectExpression(newProperties);
	}

	if (t.isArrayExpression(node)) {
		const newElements = node.elements
			.map((el, idx) => {
				if (!el) return el;
				const newPath = [...path.slice(0, -1), `${path[path.length - 1]}[${idx}]`];
				const pathStr = newPath.join('.');

				if (shouldExclude(pathStr)) {
					return null;
				}

				if (t.isObjectExpression(el) || t.isArrayExpression(el)) {
					return sanitizeNode(el, newPath);
				}

				return el;
			})
			.filter(Boolean);
		return t.arrayExpression(newElements as t.Expression[]);
	}

	return node;
}

export const SanitizeTransformer = (): Transformer<Node> => ({
	onNode(node, parent) {
		// Only transform root-level ObjectExpressions (e.g., export default ...)
		// Skip nested ObjectExpressions to avoid overlapping edits
		if (!t.isObjectExpression(node)) return false;

		// Only process if parent is not an ObjectExpression or ArrayExpression
		// This ensures we only handle top-level objects
		return !t.isObjectExpression(parent) && !t.isArrayExpression(parent);
	},
	transform(node) {
		if (t.isObjectExpression(node)) {
			return sanitizeNode(node);
		}
		return node;
	}
});
