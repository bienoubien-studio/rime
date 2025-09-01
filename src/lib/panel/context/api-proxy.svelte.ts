import { getContext, setContext } from 'svelte';

const API_PROXY_KEY = Symbol('api-proxy');

// Define the Resource type explicitly to avoid circular references
type Resource<T = any> = {
	data: T | null;
	isLoading: boolean;
	error: any;
	// fetchData: () => void;
	url: string;
	refresh: () => void;
};

function createAPIProxy() {
	// Use explicit type instead of ReturnType
	const resources = $state<Map<string, Resource>>(new Map());

	function getRessource<T>(url: string) {
		// Check if we already have this resource
		if (!resources.has(url)) {
			// Create a new resource
			const resource = createResource<T>(url);
			resources.set(url, resource);
		}

		return resources.get(url) as Resource<T>;
	}

	function createResource<R>(url: string): Resource<R> {
		// Use $state for the resource data to make it reactive
		let data = $state<R | null>(null);
		let isLoading = $state(true);
		let error = $state(null);

		// Fetch the data immediately
		fetchData();

		function fetchData() {
			isLoading = true;
			error = null;

			fetch(url, {
				method: 'GET',
				headers: {
					'content-type': 'application/json'
				}
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error(`HTTP error ${response.status}`);
					}
					return response.json();
				})
				.then((json) => {
					data = json;
					isLoading = false;
				})
				.catch((err) => {
					error = err;
					isLoading = false;
					console.error(`Error fetching ${url}:`, err);
				});
		}

		// The resource object with reactive properties
		return {
			get url() {
				return url;
			},
			get data() {
				return data;
			},
			get isLoading() {
				return isLoading;
			},
			get error() {
				return error;
			},
			refresh() {
				fetchData();
			}
		};
	}

	function invalidateAll() {
		resources.forEach((resource) => {
			resource.refresh();
		});
	}

	return {
		getRessource,
		invalidateAll
	};
}

export function setAPIProxyContext(key = API_PROXY.ROOT) {
	const apiProxy = createAPIProxy();
	return setContext(`${API_PROXY_KEY.toString()}.${key}`, apiProxy);
}

export function getAPIProxyContext(key = API_PROXY.ROOT) {
	return getContext<ReturnType<typeof setAPIProxyContext>>(`${API_PROXY_KEY.toString()}.${key}`);
}

export const API_PROXY = {
	DOCUMENT: 'document',
	ROOT: 'root',
	TIPTAP: 'tiptap'
};
