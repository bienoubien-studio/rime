import { UPLOAD_PATH } from '$lib/core/constant.js';
import { RizomFormError } from '$lib/core/errors/index.js';

/**
 * Validates a password string against security requirements.
 * Checks for minimum length, lowercase, uppercase, numbers, and special characters.
 *
 * @param value - The password string to validate
 * @returns True if valid, or a specific RizomFormError code if invalid
 *
 * @example
 * // Returns true for a valid password
 * password("Secure1Password!");
 *
 * // Returns an error code for an invalid password
 * password("weak"); // Returns RizomFormError.PASSWORD_MIN_8
 */
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

/**
 * Validates an email address string.
 * Ensures the email follows standard format with proper characters and domain structure.
 *
 * @param value - The email string to validate
 * @returns True if valid, or a specific RizomFormError code if invalid
 *
 * @example
 * // Returns true for a valid email
 * email("user@example.com");
 *
 * // Returns an error code for an invalid email
 * email("invalid-email"); // Returns RizomFormError.INVALID_EMAIL
 */
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

/**
 * Validates a telephone number string.
 * Ensures the phone number contains only digits, spaces, and the plus sign.
 *
 * @param value - The telephone number string to validate
 * @returns True if valid, or a specific RizomFormError code if invalid
 *
 * @example
 * // Returns true for a valid phone number
 * tel("+1 555 123 4567");
 *
 * // Returns an error code for an invalid phone number
 * tel("abc123"); // Returns RizomFormError.INVALID_PHONE
 */
export const tel = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (!/^[+\d\s]+$/.test(value)) {
		return RizomFormError.INVALID_PHONE;
	}
	return true;
};

/**
 * Validates a URL string.
 * Ensures the URL follows standard HTTP/HTTPS format with proper domain structure.
 *
 * @param value - The URL string to validate
 * @returns True if valid, or a specific RizomFormError code if invalid
 *
 * @example
 * // Returns true for a valid URL
 * url("https://example.com/page");
 *
 * // Returns an error code for an invalid URL
 * url("not-a-url"); // Returns RizomFormError.INVALID_URL
 */
export const url = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (!/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/=,]*)$/.test(value)) {
		return RizomFormError.INVALID_URL;
	}
	return true;
};

/**
 * Validates a slug string.
 * Ensures the slug contains only lowercase letters, numbers, and hyphens.
 *
 * @param value - The slug string to validate
 * @returns True if valid, or a specific RizomFormError code if invalid
 *
 * @example
 * // Returns true for a valid slug
 * slug("my-page-slug-123");
 *
 * // Returns an error code for an invalid slug
 * slug("Invalid Slug!"); // Returns RizomFormError.INVALID_SLUG
 */
export const slug = (value: unknown) => {
	if (typeof value !== 'string') {
		return RizomFormError.NOT_A_STRING;
	}
	if (!/^[a-z0-9-]+$/.test(value)) {
		return RizomFormError.INVALID_SLUG;
	}
	return true;
};

/**
 * Validates a link object with different validation based on link type.
 * Supports tel, email, url, and anchor link types.
 *
 * @param link - The link object with type and value properties
 * @returns True if valid, or a string with the error type and message if invalid
 *
 * @example
 * // Returns true for a valid email link
 * link({ type: 'email', value: 'user@example.com' });
 *
 * // Returns an error string for an invalid URL link
 * link({ type: 'url', value: 'invalid-url' }); // Returns "url::INVALID_URL"
 */
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

/**
 * Validates that a path string follows the required format:
 * - Must start with ROOT_NAME
 * - Only allows alphanumeric characters, hyphens, underscores, spaces, and the separator
 * - Can only use the defined separator
 * @example
 * validatePath("root:folder:subfolder") // valid
 * validatePath("root:folder with spaces:sub-folder_name") // valid
 * validatePath("root/folder") // invalid
 * validatePath("root:folder$") // invalid
 */
export const uploadPath = (value: unknown): string | true => {
	if (typeof value !== 'string') {
		return 'path should be a string';
	}

	// Check if path starts with ROOT_NAME
	if (!value.startsWith(UPLOAD_PATH.ROOT_NAME)) {
		return `Path must start with "${UPLOAD_PATH.ROOT_NAME}"`;
	}

	// Create a mutable copy for normalization
	let normalizedPath = value;

	// Remove trailing separator if present
	while (normalizedPath !== UPLOAD_PATH.ROOT_NAME && normalizedPath.endsWith(UPLOAD_PATH.SEPARATOR)) {
		normalizedPath = normalizedPath.slice(0, -1);
	}

	// Only allow alphanumeric characters, hyphens, underscores, spaces, and the separator
	// The regex ensures:
	// 1. Starts with ROOT_NAME
	// 2. Followed by zero or more segments (each segment starts with separator followed by valid chars)
	const validPathRegex = new RegExp(`^${UPLOAD_PATH.ROOT_NAME}(${UPLOAD_PATH.SEPARATOR}[a-zA-Z0-9\\-_ ]+)*$`);

	if (!validPathRegex.test(normalizedPath)) {
		return 'Path contains invalid characters. Only alphanumeric characters, hyphens, underscores, and spaces are allowed.';
	}

	return true;
};

/**
 * Collection of validation utility functions for common data types.
 * Each function returns true if the value is valid, or an error code/message if invalid.
 */
const validate = {
	uploadPath,
	password,
	email,
	slug,
	url,
	tel,
	link
};

export default validate;
