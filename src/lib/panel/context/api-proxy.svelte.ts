import { getContext, setContext } from 'svelte';
import { readable, writable } from 'svelte/store';

const PROXY_KEY = Symbol('rizom.APIProxy');

type Ressource = ReturnType<typeof createRessource>

function createRessource(url: string) {

  const getData = async (url: string): Promise<any> => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    });
  };

  let data = $state<any>(null);

  $effect(() => {
    if(data === null){
      getData(url).then(r => r.json()).then((result) => {
        data = result;
      });
    }
  });

  return {
    url,
    get data() {
      return data;
    },
    set data(value){
      data = value
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

  const invalidateAll = () => {
    ressources.forEach(r => r.data = null);
  };

  return {
    getRessource,
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
