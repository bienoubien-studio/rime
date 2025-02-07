import { t__ } from 'rizom/panel/i18n';
import type { FormErrors } from 'rizom/types';

class RizomError extends Error {
	static UNKWONW = 'unknown';
	static FORM_ERROR = 'form_error';
	static INVALID_DATA = 'invalid_data';
	static USER_BANNED = 'user_banned';
	static UNAUTHORIZED = 'unauthorized';
	static INVALID_CREDENTIALS = 'invalid_credentials';
	static NOT_FOUND = 'not_found';
	static HOOK = 'hook_error';
	static UPLOAD = 'upload_error';
	static INIT = 'init_error';

	code = RizomError.UNKWONW;
	status: number;

	constructor(code: string, message?: string, ...args: any) {
		message = message || t__(`errors.${code}`);
		super(message, ...args);
		this.code = code;
		const statusCodes = {
			[RizomError.FORM_ERROR]: 400,
			[RizomError.INVALID_CREDENTIALS]: 401,
			[RizomError.UNAUTHORIZED]: 403,
			[RizomError.USER_BANNED]: 403,
			[RizomError.NOT_FOUND]: 404
		};
		this.status = statusCodes[code] || 500;
	}
}

class RizomFormError extends RizomError {
	static INVALID_FIELD = 'invalid_field';
	static REQUIRED_FIELD = 'required_field';
	static UNIQUE_FIELD = 'unique_field';
	static VALIDATION_ERROR = 'validation_error';
	static INVALID_PHONE = 'invalid_phone';
	static INVALID_URL = 'invalid_url';
	static INVALID_SLUG = 'invalid_slug';
	static INVALID_EMAIL = 'invalid_email';
	static PASSWORD_MIN_8 = 'password_min_8';
	static PASSWORD_LOWERCASE_MISSING = 'password_lowercase_missing';
	static PASSWORD_UPPERCASE_MISSING = 'password_uppercase_mmissing';
	static PASSWORD_NUMBER_MISSING = 'password_number_missing';
	static PASSWORD_SPECIAL_CHAR_MISSING = 'password_special_char_missing';
	static NOT_A_STRING = 'not_a_string';

	errors: FormErrors;

	constructor(errors: FormErrors) {
		const message = Object.entries(errors)
			.map(([field, code]) => t__(`errors.${code}`, field))
			.join(', ');
		super(RizomError.FORM_ERROR, message);

		this.errors = errors;
	}
}

export { RizomError, RizomFormError };
