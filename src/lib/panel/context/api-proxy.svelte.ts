import { getContext, setContext } from 'svelte';

const PROXY_KEY = Symbol('rizom.APIProxy');

type Ressource = ReturnType<typeof createRessource>

function createRessource(url: string) {
  
  const getData = async (url: string): Promise<any> => {
    console.log('fetch : ' + url);
    return fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    });
  };

  let data = $state<any>(null);
  let isValid = $state(false);
  
  $effect(() => {
    if (!isValid) {
      getData(url).then(r => r.json()).then((result) => {
        data = result;
        isValid = true;
      });
    }
  });

  $inspect(data)

  return {
    url,
    get data() {
      return data;
    },
    get isValid() {
      return isValid;
    },
    set isValid(v: boolean) {
      isValid = v;
    }
  }
}

function createStore() {
  let ressources = $state<Ressource[]>([]);

  const getLocaleRessource = (url: string) => {
    return ressources.find((r) => r.url === url);
  };

  const getRessource = (url: string) => {
    const localeRessource = getLocaleRessource(url);
    if (!localeRessource) { 
      const ressource = createRessource(url);
      ressources.push(ressource);
      return ressource;
    } else {
      return localeRessource;
    }
  };

  const invalidate = (url: string) => {
    const ressource = getLocaleRessource(url);
    if (ressource) {
      ressource.isValid = false;
    }
  };

  const invalidateAll = () => {
    ressources.forEach(r => r.isValid = false);
  };

  return {
    getRessource,
    invalidate,
    invalidateAll
  };
}

export function setAPIProxyContext(key: string) {
  const store = createStore();
  return setContext(`${PROXY_KEY.toString()}.${key}`, store);
}

export function getAPIProxyContext(key: string) {
  return getContext<ReturnType<typeof setAPIProxyContext>>(`${PROXY_KEY.toString()}.${key}`);
}
