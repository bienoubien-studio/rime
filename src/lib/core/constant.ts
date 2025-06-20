export const PACKAGE_NAME = 'rizom';

export const PANEL_USERS = 'staff';

export const VERSIONS_STATUS = {
	DRAFT: 'draft',
	PUBLISHED: 'published'
} as const;

export const PARAMS = {
	DEPTH: 'depth',
	DRAFT: 'draft',
	LIMIT: 'limit',
	LOCALE: 'locale',
	OFFSET: 'offset',
	REDIRECT: 'redirect',
	SELECT: 'select',
	SORT: 'sort',
	VERSION_ID: 'versionId',
	UPLOAD_PATH: 'uploadPath'
} as const;

export const UPLOAD_PATH = {
	SEPARATOR: ":",
	ROOT_NAME: "root",
} as const

export type VersionsStatus = (typeof VERSIONS_STATUS)[keyof typeof VERSIONS_STATUS];
