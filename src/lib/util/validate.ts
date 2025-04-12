import { RizomFormError } from 'rizom/errors/index.js';

export const password = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (value.length < 8) {
		return RizomFormError.PASSWORD_MIN_8;
	} else if (!/[a-z]/.test(value)) {
		return RizomFormError.PASSWORD_LOWERCASE_MISSING;
	} else if (!/[A-Z]/.test(value)) {
		return RizomFormError.PASSWORD_UPPERCASE_MISSING;
	} else if (!/\d/.test(value)) {
		return RizomFormError.PASSWORD_NUMBER_MISSING;
	} else if (!/[#.?"'(§)_=!+:;@$%^&*-]/.test(value)) {
		return RizomFormError.PASSWORD_SPECIAL_CHAR_MISSING;
	}
	return true;
};

export const email = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	// This regex ensures:
	// 1. Starts with letter/number
	// 2. Can contain .-_ between letters/numbers
	// 3. Can't have consecutive dots
	// 4. Can't end with .-_ before @
	if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[^\s@]+\.[^\s@]+$/.test(value)) {
		return RizomFormError.INVALID_EMAIL;
	}
	return true;
};

export const tel = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (!/^[+\d\s]+$/.test(value)) {
		return RizomFormError.INVALID_PHONE;
	}
	return true;
};

export const url = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (
		!/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=,]*)$/.test(
			value
		)
	) {
		return RizomFormError.INVALID_URL;
	}
	return true;
};

export const slug = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (!/^[a-z0-9-]+$/.test(value)) {
		return RizomFormError.INVALID_SLUG;
	}
	return true;
};

export const link = (link: any) => {
	const { type, value } = link;
	
	if (type === 'tel') {
		const valid = validate.tel(value);
		return typeof valid === 'string' ? `tel::${valid}` : true;
	}
	if (type === 'email') {
		const valid = validate.email(value);
		return typeof valid === 'string' ? `email::${valid}` : true;
	}
	if (type === 'url') {
		const valid = validate.url(value);
		return typeof valid === 'string' ? `url::${valid}` : true;
	}
	if (type === 'anchor') {
		const valid = validate.slug(value);
		return typeof valid === 'string' ? `anchor::${valid}` : true;
	}
	return true;
};

const validate = {
	password,
	email,
	slug,
	url,
	tel,
	link
};

export default validate;
