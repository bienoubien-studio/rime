import { getContext, setContext } from 'svelte';
import { getConfigContext } from './config.svelte';

const LOCALE_KEY = Symbol('rizom.locale');

function createStore(initial?: string) {
	let code = $state<string>();
	let bcp47 = $state<string>();
	let label = $state<string>();

	const config = getConfigContext();

	const setValue = (value?: string) => {
		if (config.raw.localization && value) {
			code = value;
			bcp47 = config.raw.localization.locales.find((l) => l.code === code)?.bcp47;
			label = config.raw.localization.locales.find((l) => l.code === code)?.label;
		}
	};

	setValue(initial);

	const dateFormat = (
		date: Date | string,
		args: { short?: boolean; withTime?: boolean } = { short: false, withTime: false }
	) => {
		const { short, withTime } = args;

		if (typeof date === 'string') {
			date = new Date(date);
		}

		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		};
		if (short) delete options.weekday;
		if (withTime) {
			options.hour = '2-digit';
			options.minute = '2-digit';
			options.second = undefined;
			options.hour12 = false; // Use 24-hour format
		}
		if (bcp47) {
			return date.toLocaleDateString(bcp47, options);
		} else {
			return date.toLocaleDateString('en-US', options);
		}
	};

	return {
		dateFormat,
		get defaultCode() {
			return config.raw.localization?.default;
		},
		get code() {
			return code;
		},
		get label() {
			return label;
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
