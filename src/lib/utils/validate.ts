import type { Link } from 'rizom';

export const password = (value: unknown) => {
	if (typeof value !== 'string') {
		return 'Expect a string';
	}
	if (value.length < 8) {
		return 'Min. 8 characters';
	} else if (!/[a-z]/.test(value)) {
		return 'Include lowercase letter';
	} else if (!/[A-Z]/.test(value)) {
		return 'Include uppercase letter';
	} else if (!/\d/.test(value)) {
		return 'Include number';
	} else if (!/[#.?"'(§)_=!+:;@$%^&*-]/.test(value)) {
		return 'Include a special character';
	}
	return true;
};

export const email = (value: string) => {
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
		return 'email is invalid';
	}
	return true;
};

export const tel = (value: string) => {
	if (!/^[+\d\s]+$/.test(value)) {
		return 'Invalid phone number';
	}
	return true;
};

export const url = (value: string) => {
	if (
		!/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=,]*)$/.test(
			value
		)
	) {
		return 'Invalid url';
	}
	return true;
};

export const slug = (value: string) => {
	if (!/^[a-z0-9-]+$/.test(value)) {
		return 'Invalid slug';
	}
	return true;
};

export const link = (value: Link) => {
	const { type, link } = value;

	if (type === 'tel') {
		const valid = validate.tel(link);
		return typeof valid === 'string' ? `tel::${valid}` : valid;
	}
	if (type === 'url') {
		const valid = validate.url(link);
		return typeof valid === 'string' ? `url::${valid}` : valid;
	}
	if (type === 'anchor') {
		const valid = validate.slug(link);
		return typeof valid === 'string' ? `anchor::${valid}` : valid;
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
