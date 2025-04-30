import { flatten } from 'flat';
import cloneDeep from 'clone-deep';
import { diff } from 'deep-object-diff';
import { applyAction, deserialize } from '$app/forms';
import { toast } from 'svelte-sonner';
import { moveItem } from '../../util/array.js';
import { invalidateAll } from '$app/navigation';
import { getContext, setContext } from 'svelte';
import { setErrorsContext } from './errors.svelte.js';
import { getCollectionContext } from './collection.svelte.js';
import { getUserContext } from './user.svelte.js';
import { getValueAtPath, setValueAtPath } from '../../util/object.js';
import { snapshot } from '../../util/state.js';
import { getLocaleContext } from './locale.svelte.js';
import type { ActionResult } from '@sveltejs/kit';
import type { AnyFormField } from '$lib/types/fields.js';
import type { Dic } from '$lib/types/util';
import type { CompiledCollection, CompiledArea } from '$lib/types/config.js';
import type { AreaSlug, TreeBlock,GenericDoc, GenericBlock } from '$lib/types/doc.js';
import { isObjectLiteral } from '$lib/util/object.js';
import { getAPIProxyContext } from './api-proxy.svelte.js';
import { t__ } from '../../i18n/index.js';
import { getFieldConfigByPath } from 'rizom/util/config.js';

function createDocumentFormState<T extends GenericDoc = GenericDoc>({
	initial,
	config,
	readOnly,
	key,
	onNestedDocumentCreated,
	onDataChange,
	onFieldFocus
}: Args<T>) {
	//
	let intialDoc = $state(initial);
	let doc = $state<T>(initial);
	const documentConfig = config;
	const changes = $derived<Partial<GenericDoc>>(diff(intialDoc, doc));
	let isDisabled = $state(readOnly);
	let processing = $state(false);
	let element = $state<HTMLFormElement>();
	const operation = $derived(doc.id ? 'update' : 'create');
	const user = getUserContext();
	const errors = setErrorsContext(key);
	const isCollection = documentConfig.type === 'collection';
	const collection = isCollection ? getCollectionContext(documentConfig.slug) : null;
	const hasError = $derived(errors.length);
	const canSubmit = $derived(
		!isDisabled && !readOnly && Object.keys(changes).length > 0 && !hasError
	);
	const nestedLevel = initLevel();
	const initialTitle = initTitle();
	const isLiveEdit = !!onDataChange;
	const locale = getLocaleContext();
	let title = $state(initialTitle);

	const apiProxy = getAPIProxyContext('document')

	function initLevel() {
		const last = key.split('_').pop() as string;
		const isDigit = /[\d]+/.test(last);
		return isDigit ? parseInt(last) : 0;
	}
	
	function initTitle() {
		if (documentConfig.type === 'area') {
			return documentConfig.label;
		} else {
			$effect(() => {
				title = getValueAtPath(documentConfig.asTitle, doc) || '[untitled]';
			});
			const initialTitle = getValueAtPath<string>(documentConfig.asTitle, doc);
			return doc && initialTitle ? initialTitle : '[untitled]';
		}
	}

	const rebuildPaths = (items: any[], basePath: string, parentPath: string = basePath) => {
		return items.map((item, index) => {
			// Clone the item
			const newItem = cloneDeep(item);

			// If item has a path property, update it with parent path
			if ('path' in newItem) {
				newItem.path = parentPath;
			}

			// If item is part of an array, update its position
			newItem.position = index;

			// Process all properties of the item
			Object.keys(newItem).forEach((key) => {
				// If property is an array of object, process it recursively
				if (
					Array.isArray(newItem[key]) &&
					newItem[key].length &&
					isObjectLiteral(newItem[key][0])
				) {
					const newParentPath = `${parentPath}.${index}.${key}`;
					newItem[key] = rebuildPaths(newItem[key], basePath, newParentPath);
				}
			});

			return newItem;
		});
	};

	function setValue(path: string, value: any) {
		doc = setValueAtPath(doc, path, value);
		if (collection && operation === 'update') collection.updateDoc(doc);
		if (onDataChange) onDataChange({ path, value });
	}

	/**
	 * Function that return a possible reactive value given a path.
	 *
	 * @param path Field path ex: blocks.0.title
	 * @returns the document nested value wich can be a $state or anything else
	 *
	 * @example
	 * const form = getDocumentFormContext()
	 * const value = form.useValue('blocks.0.title')
	 *
	 * //value will update if doc.blocks.0.title update
	 */
	function useValue<T>(path: string): T | null {
		return getValueAtPath(path, doc) || null;
	}

	function useTree(path: string) {
		// Stamp used for re-render
		let stamp = $state(new Date().getTime().toString());

		const generateTempId = () => 'temp-' + new Date().getTime().toString();

		const getItems = (): TreeBlock[] => {
			return getValueAtPath(path, doc) || [];
		};

		const assignItemsToDoc = (items: TreeBlock[]) => {
			doc = setValueAtPath(doc, path, items);
			if (onDataChange) onDataChange({ path, value: snapshot(items) });
			/** update stamp to rerender */
			stamp = new Date().getTime().toString();
		};

		const addItem = (emptyFields: Dic) => {
			let items = [...getItems()];
			const itemWithPath: TreeBlock = {
				...emptyFields,
				id: generateTempId(),
				path: path,
				position: items.length,
				_children: []
			};
			items = items.toSpliced(items.length, 0, itemWithPath);
			assignItemsToDoc(items);
		};

		const deleteItem = (atPath: string, index: number) => {
			let items = cloneDeep(snapshot(getItems()));

			// Get target array
			const targetArray =
				getValueAtPath<TreeBlock[]>(atPath.replace(`${path}.`, ''), items) || items;

			// Perform the move operation
			targetArray.splice(index, 1);

			// Rebuild all paths and positions
			items = rebuildPaths(items, path);
			errors.deleteAllThatStartWith(`${path}.${index}.`);
			assignItemsToDoc(items);
		};

		const moveItem = (fromPath: string, toPath: string) => {
			let items = cloneDeep(snapshot(getItems()));

			const getArrayAndIndex = (path: string) => {
				const parts = path.split('.');
				let current = items;
				let parentArray = items;
				let finalIndex = parseInt(parts[parts.length - 1]);

				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					if (part === '_children') {
						continue;
					}
					const index = parseInt(part);
					parentArray = current;
					if (!current[index]._children) {
						current[index]._children = [];
					}
					current = current[index]._children;
				}

				return {
					array: parts.includes('_children') ? current : parentArray,
					index: finalIndex,
					fullPath: parts.slice(0, -1).join('.')
				};
			};

			// Get source and target information
			const source = getArrayAndIndex(fromPath);
			const target = getArrayAndIndex(toPath);

			// Perform the move operation
			const [itemToMove] = source.array.splice(source.index, 1);
			target.array.splice(target.index, 0, itemToMove);

			// Rebuild paths and positions
			items = rebuildPaths(items, path);
			assignItemsToDoc(items);
		};

		return {
			addItem,
			moveItem,
			deleteItem,
			path,
			get stamp() {
				return stamp;
			},
			get items() {
				return getItems();
			}
		};
	}

	function useBlocks(path: string) {
		const generateTempId = () => 'temp-' + new Date().getTime().toString();

		const getBlocks = (): GenericBlock[] => {
			return cloneDeep(getValueAtPath(path, doc)) || [];
		};
		
		const assignBlocksToDoc = (blocks: GenericBlock[]) => {
			blocks = rebuildPaths(blocks, path)
			doc = setValueAtPath(doc, path, blocks);
			if (onDataChange) onDataChange({ path, value: snapshot(blocks) });
		};
		
		const addBlock: AddBlock = (block) => {
			const blockWithPath: GenericBlock = {
				...block,
				id: generateTempId(),
				type: block.type,
				path: path,
				position: block.position
			};
			let blocks = [...getBlocks()];
			blocks = blocks.toSpliced(block.position, 0, blockWithPath);
			assignBlocksToDoc(blocks);
		};

		const deleteBlock = (index: number) => {
			const blocks = [...getBlocks()]
				.filter((_, i) => i !== index)
				.map((block, index) => ({ ...block, position: index }));
			errors.deleteAllThatStartWith(`${path}.${index}.`);
			assignBlocksToDoc(blocks);
		};

		const moveBlock: MoveBlock = (from, to) => {
			let blocks = moveItem(getBlocks(), from, to);
			blocks = blocks.map((block, index) => ({
				...block,
				position: index
			}));
			assignBlocksToDoc(blocks);
		};

		const duplicateBlock = (index: number) => {
			// return;
			let blocks = [...getBlocks()];

			const cloneBlock = <T>(block: GenericBlock) => {
				// First deep clone the block so duplicate origin
				// is not impacted.
				let clone = cloneDeep(block);
				// Function to reset all nested id properties
				// so nested elements are threated as created elements
				const resetIds = <T extends Record<string, any>>(obj: T) => {
					if ('id' in obj) {
						obj = { ...obj, id: generateTempId() };
					}
					for (const key of Object.keys(obj)) {
						let value = obj[key];
						if (Array.isArray(value) && value.length && isObjectLiteral(value[0])) {
							obj = {
								...obj,
								[key]: value.map((child) => resetIds(child))
							};
						}
					}
					return obj;
				};
				// set temp-ids for nested elements
				return resetIds(clone);
			};

			const blockCopy = cloneBlock(blocks[index]);

			blocks.splice(index + 1, 0, blockCopy);
			blocks = blocks.map((block, index) => ({
				...block,
				position: index
			}));
			assignBlocksToDoc(blocks);
		};

		return {
			addBlock,
			deleteBlock,
			moveBlock,
			duplicateBlock,

			get blocks() {
				return getBlocks();
			}
		};
	}

	/**
	 * Function that return an unreactive snapshot of a value given a path.
	 *
	 * @param path Field path ex: blocks.0.title
	 * @returns an unreactive snapshot
	 *
	 * @example
	 * const form = getDocumentFormContext()
	 * const initialValue = form.getRawValue('blocks.0.title')
	 *
	 * // value will not update if doc.blocks.0.title update
	 */
	function getRawValue(path: string) {
		return snapshot(getValueAtPath(path, doc)) || null;
	}

	function useField(path: string, config?: FormField) {
		
		if(!config){
			config = getFieldConfigByPath(path, documentConfig.fields)
			if(!config) throw new Error(`can't find config for field : ${path}`)
		}
		
		path = path || config.name;

		const parts = $derived(path.split('.'));

		const validate = (value: any) => {
			if (config.required && config.isEmpty(value)) {
				errors.set(path, 'required::required_field');
				return 'required';
			}

			if (config.validate) {
				const validated = config.validate(value, {
					data: doc,
					locale: locale.code,
					id: doc.id ?? undefined,
					operation: doc.id ? 'update' : 'create',
					user: user.attributes,
					config
				});
				if (validated !== true) {
					errors.set(path, validated);
					return false;
				}
			}

			if (errors.has(path)) {
				errors.delete(path);
			}
			return true;
		};

		return {
			get value() {
				return getValueAtPath(path, doc);
			},

			set value(value: any) {
				const valid = validate(value);
				if (operation === 'update' && !config.access.update(user.attributes)) {
					return;
				}
				if (valid) {
					setValue(path, value);
				}
			},

			get editable() {
				if (readOnly) return false
				if (operation === 'create') {
					return config.access.create(user.attributes);
				} else {
					return config.access.update(user.attributes);
				}
			},

			get visible() {
				if (config.access?.read && !config.access?.read(user.attributes)) {
					return false;
				}
				let visible = true;
				if (config.condition) {
					try {
						let siblings: Dic = doc;
						if (parts.length > 1) {
							const upperPath = path.substring(0, path.lastIndexOf('.'));
							siblings = getValueAtPath(upperPath, doc) || {};
						}
						visible = config.condition(doc, siblings);
					} catch (err: any) {
						console.error(err.message);
					}
				}
				return visible;
			},

			path,

			get error() {
				return errors.value[path] || false;
			},

			get isEmpty() {
				return !!config.isEmpty && config.isEmpty(getValueAtPath(path, doc));
			}
		};
	}

	const submit = async (action: string) => {
		if (processing) return;
		processing = true;

		const data: Dic = {};
		
		for (const key of Object.keys(changes)) {
			data[key] = doc[key];
		}

		const flatData: Dic = flatten(data);

		const formData = new FormData();

		for (const key of Object.keys(flatData)) {
			formData.set(key, flatData[key]);
		}

		const response = await fetch(action, {
			method: 'POST',
			body: formData
		});

		const result: ActionResult = deserialize(await response.text());

		if (result.type === 'success') {
			doc = result.data?.doc || (doc as GenericDoc);
			if (nestedLevel === 0) {
				toast.success(t__('common.doc_updated'));
				await invalidateAll();
				intialDoc = doc;
			} else {
				toast.success(t__('common.doc_created'));
				apiProxy.invalidateAll()
				// Do not redirect on creation if it's a nested form
				// the form will auto close and we are back to the parent
				// Form so no need to assign the returned doc
				if (onNestedDocumentCreated) onNestedDocumentCreated(doc);
			}
		} else if (result.type === 'redirect') {
			// handle redirect after document creation
			toast.success(t__('common.doc_created'));
			if (collection) collection.addDoc(doc as GenericDoc);
			applyAction(result);
		} else if (result.type === 'failure') {
			// Handle error
			if (result.data?.errors) {
				errors.value = result.data.errors;
				for (const [key, error] of Object.entries(errors.value)) {
					toast.error(key + ': ' + error);
				}
			} else {
				toast.error('An error occured');
			}
		}
		processing = false;
	};

	const enhance = (formElement: HTMLFormElement) => {
		element = formElement;
		const listener = (event: SubmitEvent) => {
			event.preventDefault();
			submit(formElement.action);
		};
		formElement.addEventListener('submit', listener);
		return {
			destroy() {
				formElement.removeEventListener('submit', listener);
			}
		};
	};

	const buildPanelActionUrl = () => {
		// Start with the base URI for the panel
		let panelUri = `/panel/${config.slug}`;
		// Add the item ID to the URI if we're updating a collection doc
		if (operation === 'update' && initial._prototype === 'collection' && initial.id) {
			panelUri += `/${initial.id}`;
		}
		// Determine the appropriate action based on whether we're creating or updating
		let actionSuffix;
		if (operation === 'create') {
			actionSuffix = '/create?/create';
		} else {
			actionSuffix = '?/update';
		}
		// Add a redirect parameter if we're in a nested form ex: relation creation
		const redirectParam = nestedLevel > 0 ? '&redirect=0' : '';

		// Combine all parts to form the final action URL
		return `${panelUri}${actionSuffix}${redirectParam}`;
	};

	return {
		key,
		setValue,
		getRawValue,
		enhance,
		useField,
		getValue,
		useBlocks,
		useTree,
		nestedLevel,
		buildPanelActionUrl,
		readOnly,

		get isDisabled() {
			return isDisabled;
		},

		set isDisabled(bool: boolean) {
			isDisabled = bool;
		},

		get element() {
			return element;
		},

		get canSubmit() {
			return canSubmit;
		},

		get processing() {
			return processing;
		},

		get doc() {
			return doc;
		},

		get changes() {
			return changes;
		},

		get errors() {
			return errors;
		},

		set doc(v) {
			doc = v;
		},

		get config() {
			return config;
		},

		get title() {
			return title;
		},

		get isLive() {
			return isLiveEdit;
		},

		setFocusedField(path: string) {
			if (isLiveEdit && onFieldFocus) {
				onFieldFocus(path);
			}
		}
	};
}

const FORM_KEY = 'rizom.form';

export function setDocumentFormContext<T extends GenericDoc>(args: Args<T>) {
	const store = createDocumentFormState(args);
	return setContext(`${FORM_KEY}.${args.key}`, store);
}

export function getDocumentFormContext<T extends GenericDoc>(key: string = 'root') {
	return getContext<DocumentFormContext<T>>(`${FORM_KEY}.${key}`);
}

export type DocumentFormContext<T extends GenericDoc = GenericDoc> = ReturnType<
	typeof setDocumentFormContext<T>
>;

type AddBlock = (block: Omit<GenericBlock, 'id' | 'path'>) => void;
type MoveBlock = (from: number, to: number) => void;

type Args<T> = {
	initial: T;
	config: (AreaSlug extends never ? never : CompiledArea) | CompiledCollection;
	readOnly: boolean;
	onDataChange?: any;
	onNestedDocumentCreated?: any;
	onFieldFocus?: any;
	key: string;
};
