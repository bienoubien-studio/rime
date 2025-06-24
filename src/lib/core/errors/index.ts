import { t__ } from '$lib/core/i18n/index.js';
import type { FormErrors } from '$lib/panel/types.js';

class RizomError extends Error {
	static BAD_REQUEST = 'bad_request';
	static CONFIG_ERROR = 'config_error';
	static FIRST_USER_DEV = 'first_user_dev';
	static FORM_ERROR = 'form_error';
	static HOOK = 'hook_error';
	static INIT = 'init_error';
	static INVALID_CREDENTIALS = 'invalid_credentials';
	static INVALID_DATA = 'invalid_data';
	static MAIL_ERROR = 'mail_error';
	static NOT_FOUND = 'not_found';
	static OPERATION_ERROR = 'operation_error';
	static UNAUTHORIZED = 'unauthorized';
	static UNKWONW = 'unknown';
	static UPLOAD = 'upload_error';
	static USER_BANNED = 'user_banned';

	code = RizomError.UNKWONW;
	status: number;

	constructor(code: string, message?: string, ...args: any) {
		// message = `${t__(`errors.${code}`)} ${message}`;
		message = `${code} — ${message || ''}`;
		super(message, ...args);
		this.code = code;
		const statusCodes = {
			[RizomError.FORM_ERROR]: 400,
			[RizomError.BAD_REQUEST]: 400,
			[RizomError.INVALID_CREDENTIALS]: 401,
			[RizomError.UNAUTHORIZED]: 403,
			[RizomError.USER_BANNED]: 403,
			[RizomError.NOT_FOUND]: 404
		};
		this.status = statusCodes[code] || 500;
	}
}

class RizomFormError extends RizomError {
	static INVALID_DATA = 'invalid_data';
	static INVALID_EMAIL = 'invalid_email';
	static INVALID_FIELD = 'invalid_field';
	static INVALID_PHONE = 'invalid_phone';
	static INVALID_SLUG = 'invalid_slug';
	static INVALID_URL = 'invalid_url';
	static NOT_A_STRING = 'not_a_string';
	static PASSWORD_LOWERCASE_MISSING = 'password_lowercase_missing';
	static PASSWORD_MIN_8 = 'password_min_8';
	static PASSWORD_NUMBER_MISSING = 'password_number_missing';
	static PASSWORD_SPECIAL_CHAR_MISSING = 'password_special_char_missing';
	static PASSWORD_UPPERCASE_MISSING = 'password_uppercase_mmissing';
	static REQUIRED_FIELD = 'required_field';
	static UNIQUE_FIELD = 'unique_field';
	static VALIDATION_ERROR = 'validation_error';

	errors: FormErrors;

	constructor(errors: FormErrors) {
		const message = Object.entries(errors)
			.map(([field, code]) => t__(`errors.${code}`, field))
			.reduce((prev, curr) => {
				if (!prev.includes(curr)) {
					prev.push(curr);
				}
				return prev;
			}, [] as string[])
			.join(', ');
		super(RizomError.FORM_ERROR, message);

		this.errors = errors;
	}
}

export { RizomError, RizomFormError };
