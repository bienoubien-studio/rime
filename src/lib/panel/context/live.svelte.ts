import { getContext, setContext } from 'svelte';
import type { BeforeNavigate } from '@sveltejs/kit';
import { isObjectLiteral, setValueAtPath } from '../../util/object.js';
import type { GenericDoc } from 'rizom/types/doc.js';

const LIVE_KEY = Symbol('rizom.live');

/**
 * Live Editing Flow:
 * 1. Live.svelte sends handshake message to iframe
 * 2. Live context in iframe receives it, enables itself
 * 3. Live context sends handshake response with its href
 * 4. Live.svelte receives the handshake response
 * 5. Live.svelte compares iframe href to expected iframeSrc
 * 6. If they match, sync is established and user can edit
 * 7. When navigating, iframe context sends message to parent with new location + ?live=1
 * 8. Live.svelte navigates to new location, maintaining live edit mode
 */

type OnDataCallback = (args: { path: string; value: any }) => void;
type LiveStore<T extends GenericDoc = GenericDoc> = ReturnType<typeof createStore<T>>;

function createStore<T extends GenericDoc = GenericDoc>(href: string) {
	let enabled = $state(false);
	let doc = $state<T>();
	const callbacks: OnDataCallback[] = [];
	let currentFocusedElement = $state<HTMLElement>();
	
	/**
	 * Handles navigation within iframe to maintain live editing mode
	 */
	const beforeNavigate = (params: BeforeNavigate) => {
		if (window && window.top && params.to?.url.href && enabled) {
			// Send navigation message to parent with live=1 param
			window.top.postMessage({ location: params.to.url.href + '?live=1' });
			params.cancel();
		}
	};

	/**
	 * Processes messages from parent window
	 */
	const onMessage = async (e: any) => {
		// Handle handshake request
		if (e.data.handshake) {
			enabled = true;
			if (window && window.top) {
				// Send handshake response with current URL
				window.top.postMessage({ handshake: href });
			}
		} 
		// Handle field updates
		else if (e.data.path && e.data.value !== undefined) {
			await handleFieldUpdate(e.data);
		} 
		// Handle focus requests
		else if (e.data.focus && typeof e.data.focus === 'string' && typeof document !== 'undefined') {
			handleFocusField(e.data.focus);
		}
	};

	/**
	 * Handles field value updates, including special handling for relation fields
	 */
	const handleFieldUpdate = async (data: { path: string; value: any }) => {
		let value = data.value;
		
		const isArray = Array.isArray(value) && value.length;
		const isArrayOfRelation =
			isArray &&
			isObjectLiteral(value[0]) &&
			'documentId' in value[0] &&
			'relationTo' in value[0];

		// Special handling for relation arrays
		if (isArrayOfRelation) {
			for (const [index, relation] of value.entries()) {
				if ('livePreview' in relation) {
					value[index] = relation.livePreview;
				} else {
					try {
						const response = await fetch(
							`/api/${relation.relationTo}/${relation.documentId}?depth=1`
						).then((r) => r.json());
						
						if (response && response.doc) {
							value[index] = response.doc;
						}
					} catch (err) {
						// Silently handle fetch errors
					}
				}
			}
		}
		
		if(!doc) throw new Error('live.doc has not been set before handleFieldUpdate')
		
		// Update the document with the new value
		doc = setValueAtPath(doc, data.path, value) as T;

	};

	/**
	 * Handles focusing a specific field in the UI
	 */
	const handleFocusField = (focusPath: string) => {
		const element = document.querySelector<HTMLElement>(`[data-field="${focusPath}"]`);
		if (element) {
			const ringStyle = '0px 0px 0px 1px red';

			// Scroll to the element
			element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });

			// Add highlight style
			element.style.boxShadow = ringStyle;
			if (currentFocusedElement) {
				currentFocusedElement.style.boxShadow = '';
			}
			currentFocusedElement = element;
		}
	};

	/**
	 * Registers a callback for data changes
	 */
	const onData = (callback: OnDataCallback) => {
		callbacks.push(callback);
	};

	// Return public interface
	return {
		beforeNavigate,
		onMessage,
		onData,
		
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

/**
 * Creates and sets the live context for the current component
 */
export function setLiveContext<T extends GenericDoc = GenericDoc>(href: string) {
	const store = createStore<T>(href);
	setContext(LIVE_KEY, store);
	return store;
}

/**
 * Gets the live context from the current component
 */
export function getLiveContext<T extends GenericDoc = GenericDoc>() {
	return getContext<LiveStore<T>>(LIVE_KEY);
}
