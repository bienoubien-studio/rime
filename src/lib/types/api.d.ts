import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { GetRegisterType } from 'rizom/types/register';
import type { Rizom } from 'rizom/rizom.server.js';
import type { BuiltCollectionConfig, BuiltGlobalConfig } from 'rizom/types/config';
import type { FormErrors } from './panel';

export type OperationQuery = {
	[key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
};
// export type OperationQuery = {
// 	where: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
// };

export interface LocalAPI {
	collection(slug: GetRegisterType<'PrototypeSlug'>): LocalAPICollectionInterface;
	global(slug: PrototypeSlug): LocalAPIGlobalInterface;
	grantAdminPrivilege(): LocalAPI;
	enforceLocale(locale: string): void;
	hasGrantedPrivilege: boolean;
}

export type LocalAPIConstructorArgs = {
	rizom: Rizom;
	event?: RequestEvent;
};

export interface LocalAPICollectionInterface {
	readonly config: BuiltCollectionConfig;
	defaultLocale: string | undefined;
	isAuth: boolean;

	emptyDoc<T extends GenericDoc = GenericDoc>(): T;
	create<T extends GenericDoc = GenericDoc>(args: {
		data: Partial<T>;
		locale?: string;
	}): Promise<{ doc: T; errors?: never } | { doc?: never; errors: FormErrors }>;

	find<T extends GenericDoc = GenericDoc>(args: {
		query: OperationQuery | string;
		locale?: string;
		sort?: string;
		depth?: number;
		limit?: number;
	}): Promise<T[]>;

	findAll<T extends GenericDoc = GenericDoc>(args?: {
		locale?: string;
		sort?: string;
		depth?: number;
		limit?: number;
	}): Promise<T[]>;

	findById<T extends GenericDoc = GenericDoc>(args: {
		id: string;
		locale?: string;
		depth?: number;
	}): Promise<T>;

	updateById<T extends GenericDoc = GenericDoc>(args: {
		id: string;
		data: Partial<T>;
		locale?: string;
	}): Promise<T | { errors: FormErrors }>;

	deleteById(args: { id: string }): Promise<string>;
}

export interface LocalAPIGlobalInterface {
	readonly config: BuiltGlobalConfig;
	defaultLocale: string | undefined;

	emptyDoc(): GenericDoc;

	find<T extends GenericDoc = GenericDoc>(args?: { locale?: string; depth?: number }): Promise<T>;

	update<T extends GenericDoc = GenericDoc>(args: {
		data: Partial<T>;
		locale?: string;
	}): Promise<T | { errors: FormErrors }>;
}
