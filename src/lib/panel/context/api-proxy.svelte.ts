import { getContext, setContext } from 'svelte';

const API_PROXY_KEY = Symbol('api-proxy');

function createAPIProxy() {
  // Use $state to make the resources collection reactive
  const resources = $state(new Map());
  
  function getRessource<T>(url:string) {
    // Check if we already have this resource
    if (!resources.has(url)) {
      // Create a new resource
      const resource = createResource(url);
      resources.set(url, resource);
    }
    
    return resources.get(url) as T;
  }
  
  function createResource(url:string) {
    // Use $state for the resource data to make it reactive
    let data = $state(null);
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
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        data = result;
        isLoading = false;
      })
      .catch(err => {
        error = err;
        isLoading = false;
        console.error(`Error fetching ${url}:`, err);
      });
    }
    
    // The resource object with reactive properties
    return {
      get url() { return url; },
      get data() { return data; },
      get isLoading() { return isLoading; },
      get error() { return error; },
      refresh() {
        fetchData();
      }
    };
  }
  
  function invalidateAll() {
    resources.forEach(resource => {
      resource.refresh();
    });
  }
  
  return {
    getRessource,
    invalidateAll
  };
}

export function setAPIProxyContext(key = 'default') {
  const apiProxy = createAPIProxy();
  return setContext(`${API_PROXY_KEY.toString()}.${key}`, apiProxy);
}

export function getAPIProxyContext(key = 'default') {
  return getContext<ReturnType<typeof setAPIProxyContext>>(`${API_PROXY_KEY.toString()}.${key}`);
}