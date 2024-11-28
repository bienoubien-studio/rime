import { getContext, setContext } from 'svelte';
import type { BeforeNavigate } from '@sveltejs/kit';
import { flatten, unflatten } from 'flat';
import { isObjectLiteral } from '../../utils/object.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/utility.js';

const LIVE_KEY = Symbol('rizom.live');

function createStore<T extends GenericDoc = GenericDoc>(src: string) {
	let enabled = $state(false);
	let doc = $state<T>();
	const callbacks: any[] = [];
	let currentFocusedElement = $state<HTMLElement>();

	const beforeNavigate = (params: BeforeNavigate) => {
		if (window && window.top) {
			if (params.to?.url.href && enabled) {
				window.top.postMessage({ location: params.to.url.href + '?live=1' });
				params.cancel();
			}
		}
	};

	const onMessage = async (e: any) => {
		/////////////////////////////////////////////
		// HandShake
		//////////////////////////////////////////////
		if (e.data.handshake) {
			enabled = true;
			if (window && window.top) {
				window.top.postMessage({ handshake: src });
			}
			/////////////////////////////////////////////
			// Set field value
			//////////////////////////////////////////////
		} else if (e.data.path && e.data.value) {
			const value = e.data.value;

			const isArray = Array.isArray(value) && value.length;

			const isArrayOfRelation =
				isArray &&
				isObjectLiteral(value[0]) &&
				'relationId' in value[0] &&
				'relationTo' in value[0];

			if (isArrayOfRelation) {
				for (const [index, relation] of value.entries()) {
					if ('livePreview' in relation) {
						value[index] = relation.livePreview;
					} else {
						const response = await fetch(
							`/api/${relation.relationTo}/${relation.relationId}?depth=1`
						).then((r) => r.json());
						if (response && response.doc) {
							value[index] = response.doc;
						}
					}
				}
			}
			doc = mergeData({ path: e.data.path, value }) as T;
		} else if (
			e.data.focus &&
			typeof e.data.focus === 'string' &&
			typeof document !== 'undefined'
		) {
			const element = document.querySelector<HTMLElement>(`[data-field="${e.data.focus}"]`);
			if (element) {
				const ringStyle = '0px 0px 0px 1px red';

				element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });

				element.style.boxShadow = ringStyle;
				if (currentFocusedElement) {
					currentFocusedElement.style.boxShadow = '';
				}
				currentFocusedElement = element;
			}
		}
	};

	const onData = (func: OnDataCallback) => {
		callbacks.push(func);
	};

	const mergeData: MergeData = (args) => {
		const { path, value } = args;
		const parts = path.split('.');
		const flatDoc: Dic = flatten(doc, {
			maxDepth: parts.length
		});
		flatDoc[path] = value;
		return unflatten(flatDoc);
	};

	return {
		beforeNavigate,
		onMessage,
		onData,
		mergeData,
		get data() {
			return { doc };
		},
		get doc() {
			return doc;
		},
		set doc(value) {
			doc = value;
		},
		get enabled() {
			return enabled;
		}
	};
}

export function setLiveContext<T extends GenericDoc = GenericDoc>(src: string) {
	const store = createStore<T>(src);
	return setContext(LIVE_KEY, store);
}

export function getLiveContext<T extends GenericDoc = GenericDoc>() {
	type ContextType = ReturnType<typeof setLiveContext<T>>;
	return getContext<ContextType>(LIVE_KEY);
}

type OnDataCallback = (args: { path: string; value: any }) => void;
type MergeData = (args: { path: string; value: any }) => GenericDoc;
