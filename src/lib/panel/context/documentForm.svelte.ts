import { flatten, unflatten } from 'flat';

import { diff } from 'deep-object-diff';
import { applyAction, deserialize } from '$app/forms';
import { toast } from 'svelte-sonner';
import { moveItem } from '../../utils/array.js';
import { invalidateAll } from '$app/navigation';
import { getContext, setContext } from 'svelte';
import { setErrorsContext } from './errors.svelte.js';
import { getCollectionContext } from './collection.svelte.js';
import { randomId } from '../../utils/random.js';
import { getUserContext } from './user.svelte.js';
import { getValueFromPath } from '../../utils/doc.js';

import { snapshot } from '../../utils/state.js';
import { getLocaleContext } from './locale.svelte.js';
import type { ActionResult } from '@sveltejs/kit';
import type { GenericBlock, GenericDoc, AnyFormField, BuiltDocConfig } from 'rizom/types';
import type { Dic } from 'rizom/types/utility';
import type { CompiledCollectionConfig, CompiledGlobalConfig } from 'rizom/types/config.js';
import { t__ } from '../i18n/index.js';

function createDocumentFormState({
	initial,
	config,
	readOnly,
	key,
	onDataChange,
	onFieldFocus,
	onNestedDocumentCreated
}: Args) {
	//
	let intialDoc = $state(initial);
	let doc = $state(initial);
	const changes = $derived<Partial<GenericDoc>>(diff(intialDoc, doc));

	const isCreateDoc = (doc: typeof initial): doc is GenericDoc => !doc.id;
	let processing = $state(false);
	let element = $state<HTMLFormElement>();
	const user = getUserContext();
	const errors = setErrorsContext(key);
	const isCollection = config.type === 'collection';
	const collection = isCollection ? getCollectionContext(config.slug) : null;
	const hasError = $derived(errors.length);
	const canSubmit = $derived(!readOnly && Object.keys(changes).length > 0 && !hasError);
	const nestedLevel = initLevel();
	const initialTitle = initTitle();
	const isLiveEdit = !!onDataChange;
	const locale = getLocaleContext();
	let title = $state(initialTitle);

	$inspect(title);

	function initLevel() {
		const last = key.split('.').pop() as string;
		const isDigit = /[\d]+/.test(last);
		return isDigit ? parseInt(last) : 0;
	}

	function initTitle() {
		if (config.type === 'global') {
			return config.label;
		} else {
			$effect(() => (title = doc[config.asTitle] || '[undefined]'));
			return doc && doc[config.asTitle] ? doc[config.asTitle] : '[undefined]';
		}
	}

	function setValue(path: string, value: any) {
		const parts = path.split('.');
		const flatDoc: Dic = flatten(doc, {
			maxDepth: parts.length
		});

		flatDoc[path] = value;
		doc = unflatten(flatDoc);

		if (collection && !isCreateDoc(doc)) collection.updateDoc(doc);
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
	function useValue(path: string) {
		const parts = path.split('.');
		return getValueFromPath(doc, path, { maxDepth: parts.length }) || null;
	}

	function useBlocks(path: string) {
		const parts = path.split('.');

		const getBlocks = (): GenericBlock[] => {
			return getValueFromPath(doc, path, { maxDepth: parts.length }) || [];
		};

		const assignBlocksToDoc = (blocks: GenericBlock[]) => {
			const flatDoc: Dic = flatten(doc, {
				maxDepth: parts.length
			});
			flatDoc[path] = blocks;
			doc = unflatten(flatDoc);
			if (onDataChange) onDataChange({ path, value: snapshot(blocks) });
		};

		const addBlock: AddBlock = (block) => {
			const blockWithPath: GenericBlock = {
				...block,
				id: 'temp-' + randomId(8),
				type: block.type,
				path: path,
				position: block.position
			};
			let blocks = [...getBlocks()];
			blocks = blocks.toSpliced(block.position, 0, blockWithPath);
			assignBlocksToDoc(blocks);
		};

		const deleteBlock: DeleteBlock = (index) => {
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

		return {
			addBlock,
			deleteBlock,
			moveBlock,

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
		const parts = path.split('.');
		return snapshot(getValueFromPath(doc, path, { maxDepth: parts.length })) || null;
	}

	function useField(path: string | undefined, config: AnyFormField) {
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

		const props = {
			get style() {
				let visible = true;
				if (config.condition) {
					try {
						visible = config.condition(doc);
					} catch (err: any) {
						console.log(err.message);
					}
				}
				return visible ? null : 'display:none;';
			},
			get disabled() {
				return readOnly;
			}
		};

		return {
			props,
			get value() {
				return getValueFromPath(doc, path, { maxDepth: parts.length });
			},

			set value(value: any) {
				console.log('set value');
				const valid = validate(value);
				if (!isCreateDoc(doc) && !config.access.update(user.attributes)) {
					return;
				}
				if (valid) {
					setValue(path, value);
				}
			},

			get editable() {
				if (isCreateDoc(doc)) {
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
						visible = config.condition(doc);
					} catch (err: any) {
						console.log(err.message);
					}
				}
				return visible;
			},

			get error() {
				return errors.value[path] || false;
			},

			get isEmpty() {
				return (
					!!config.isEmpty &&
					config.isEmpty(getValueFromPath(doc, path, { maxDepth: parts.length }))
				);
			}
			// get props() {
			// 	return {
			//        get disabled() { return readOnly },
			//        get visible() { return visible },
			// 	};
			// }
		};
	}

	const submit = async (action: string) => {
		if (processing) return;
		processing = true;

		const data: Dic = {};
		// const isUpload = config.type === 'collection' && isUploadConfig(config);

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

		// return async ({ result, update }) => {
		if (result.type === 'success') {
			doc = result.data?.doc || (doc as GenericDoc);
			if (nestedLevel === 0) {
				toast.success(t__('common.doc_updated'));
				await invalidateAll();
				intialDoc = doc;
			} else {
				toast.success(t__('common.doc_created'));
				if (onNestedDocumentCreated) onNestedDocumentCreated(doc);
			}
		} else if (result.type === 'redirect') {
			toast.success(t__('common.doc_created'));
			if (collection) collection.addDoc(doc as GenericDoc);
			applyAction(result);
		} else if (result.type === 'failure') {
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
		// }
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

	return {
		setValue,
		getRawValue,
		enhance,
		useField,
		readOnly,
		useValue,
		useBlocks,
		nestedLevel,

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

export function setDocumentFormContext(args: Args) {
	const store = createDocumentFormState(args);
	return setContext(`${FORM_KEY}.${args.key}`, store);
}

export function getDocumentFormContext(key: string = 'root') {
	return getContext<DocumentFormContext>(`${FORM_KEY}.${key}`);
}

export type DocumentFormContext = ReturnType<typeof setDocumentFormContext>;

type AddBlock = (block: Omit<GenericBlock, 'id' | 'path'>) => void;
type DeleteBlock = (index: number) => void;
type MoveBlock = (from: number, to: number) => void;

type Args = {
	initial: GenericDoc;
	config: CompiledGlobalConfig | CompiledCollectionConfig;
	readOnly: boolean;
	onNestedDocumentCreated?: any;
	onDataChange?: any;
	onFieldFocus?: any;
	key: string;
};
