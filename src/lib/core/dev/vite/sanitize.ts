import type { BlockStatement, Node } from '@babel/types';
import * as t from '@babel/types';
import { babelParse, getLang, walkASTAsync } from 'ast-kit';
import fs from 'fs';
import { generateTransform, MagicStringAST, type CodeTransform } from 'magic-string-ast';
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

export function sanitize(): Plugin {
	// const virtualModuleId = 'virtual:browser-config';
	// const resolvedVirtualModuleId = '\0' + virtualModuleId;
	let server: ViteDevServer;

	return {
		name: 'rizom:sanitize-config',

		enforce: 'pre',

		configureServer(_server) {
			server = _server;
		},

		resolveId(id) {
			const isSSR = this.environment.config.consumer === 'server';
			if (!isSSR && id.includes('rizom.config')) {
				return id;
			}
		},

		load(id) {
			const isSSR = this.environment.config.consumer === 'server';
			if (!isSSR && id.includes('rizom.config')) {
				const configPath = path.resolve(process.cwd(), 'src/' + id.replace('.js', '.ts'));
				return fs.readFileSync(configPath, 'utf-8');
				// console.log(server.moduleGraph.getModuleById(id))
			}
		},

		async transform(code, id) {
			const isSSR = this.environment.config.consumer === 'server';
			if (!isSSR && id.includes('rizom.config')) {
				const sanitized = await sanitizeFunction(code, id);
				console.log(sanitized);
				return sanitized?.code || '';
			}
		}
	};
}

interface NodeRef<T = Node> {
	value: T;
	set: (node: T) => void;
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

export type Awaitable<T> = T | PromiseLike<T>;

export interface Transformer<T extends Node = Node> {
	/**
	 * Filter files to transform
	 * @param id - filename
	 * @returns whether to include the file
	 */
	transformInclude?: (id: string) => Awaitable<boolean>;
	/**
	 * Filter nodes to transform
	 */
	onNode?:
		| ((node: Node, parent: Node | null | undefined, index: number | null | undefined) => Awaitable<boolean>)
		| ((node: Node, parent: Node | null | undefined, index: number | null | undefined) => node is T);
	/**
	 * Transform the node to a new node or string
	 *
	 * @returns the new node or string, or `false` to remove the node
	 */
	transform: (
		node: T,
		code: string,
		context: {
			id: string;
		}
	) => Awaitable<string | Node | false | undefined | null>;
	/**
	 * It will be called after all nodes are transformed
	 */
	finalize?: (s: MagicStringAST) => Awaitable<void>;
}

interface TransformerParsed {
	transformer: Transformer;
	nodes: NodeRef<Node | undefined>[];
}

export async function sanitizeFunction(code: string, id: string): Promise<CodeTransform | undefined> {
	const { getNodeRef } = useNodeRef();

	const transformers: TransformerParsed[] = [{ transformer: SanitizeTransformer(), nodes: [] }];

	const parseOptions = {
		sourceType: 'module'
	};
	console.log(id);
	console.log(getLang(id));
	console.log('-------- CODE');
	console.log(code);
	console.log('-------- END CODE');

	const program = babelParse(code, 'ts', parseOptions);
	console.log(program);

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
		node.properties = node.properties.filter((prop) => {
			if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
				const key = prop.key.name;
				const newPath = [...path, key];
				const pathStr = newPath.join('.');

				if (shouldExclude(pathStr)) {
					return false; // remove this property entirely
				}

				// recurse into nested values
				if (t.isObjectExpression(prop.value) || t.isArrayExpression(prop.value)) {
					const sanitized = sanitizeNode(prop.value, newPath);
					if (!sanitized) return false;
					prop.value = sanitized as any;
				}
			}
			return true;
		});
		return node;
	}

	if (t.isArrayExpression(node)) {
		node.elements = node.elements
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
		return node;
	}

	return node;
}

export const SanitizeTransformer = (): Transformer<t.Node> => ({
	transform(node) {
		if (t.isObjectExpression(node)) {
			return sanitizeNode(node);
		}
		return node;
	}
});
