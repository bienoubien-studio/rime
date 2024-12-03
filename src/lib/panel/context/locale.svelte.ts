import { getContext, setContext } from 'svelte';
import { getConfigContext } from './config.svelte';

const LOCALE_KEY = Symbol('rizom.locale');

function createStore(initial?: string) {
	let code = $state<string>();
	let bcp47 = $state<string>();
	const config = getConfigContext();

	const setValue = (val?: string) => {
		if (config.raw.localization && val) {
			code = val;
			bcp47 = config.raw.localization.locales.find((l) => l.code === code)?.bcp47;
		}
	};

	setValue(initial);

	const dateFormat = (date: Date, short = false) => {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		};
		if (short) delete options.weekday;
		if (bcp47) {
			return date.toLocaleDateString(bcp47, options);
		} else {
			return date.toLocaleDateString('en-US', options);
		}
	};

	return {
		dateFormat,

		get code() {
			return code;
		},
		get bcp47() {
			return bcp47;
		},
		set code(v: string | undefined) {
			setValue(v);
		}
	};
}

export function setLocaleContext(initial?: string) {
	const store = createStore(initial);
	return setContext(LOCALE_KEY, store);
}

export function getLocaleContext() {
	return getContext<ReturnType<typeof setLocaleContext>>(LOCALE_KEY);
}
