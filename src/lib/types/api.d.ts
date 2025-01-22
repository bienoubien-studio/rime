import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Rizom } from 'rizom/rizom.server.js';
import type {
	BuiltCollectionConfig,
	BuiltGlobalConfig,
	CompiledCollectionConfig
} from 'rizom/types/config';
import type { FormErrors } from './panel';
import type { RegisterCollection, RegisterGlobal } from 'rizom';

export type OperationQuery = {
	[key: string]: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
};
// export type OperationQuery = {
// 	where: undefined | string | string[] | OperationQuery | OperationQuery[] | boolean;
// };

export interface LocalAPI {
	collection<Slug extends keyof RegisterCollection>(
		slug: Slug
	): LocalAPICollectionInterface<RegisterCollection[Slug]>;

	global<Slug extends keyof RegisterGlobal>(
		slug: Slug
	): LocalAPIGlobalInterface<RegisterGlobal[Slug]>;

	grantAdminPrivilege(): LocalAPI;
	enforceLocale(locale: string): void;
	hasGrantedPrivilege: boolean;
	readonly rizom: Rizom;
}

export type LocalAPIConstructorArgs = {
	rizom: Rizom;
	event?: RequestEvent;
};

export interface LocalAPICollectionInterface<Doc extends GenericDoc = GenericDoc> {
	readonly config: CompiledCollectionConfig;
	defaultLocale: string | undefined;
	isAuth: boolean;

	emptyDoc(): Doc;
	create(args: {
		data: Partial<Doc>;
		locale?: string;
	}): Promise<{ doc: Doc; errors?: never } | { doc?: never; errors: FormErrors }>;

	find(args: {
		query: OperationQuery | string;
		locale?: string;
		sort?: string;
		depth?: number;
		limit?: number;
	}): Promise<Doc[]>;

	findAll(args?: {
		locale?: string;
		sort?: string;
		depth?: number;
		limit?: number;
	}): Promise<Doc[]>;

	findById(args: { id: string; locale?: string; depth?: number }): Promise<Doc | null>;

	updateById(args: {
		id: string;
		data: Partial<Doc>;
		locale?: string;
	}): Promise<Doc | { errors: FormErrors }>;

	deleteById(args: { id: string }): Promise<string>;
}

export interface LocalAPIGlobalInterface<Doc extends GenericDoc = GenericDoc> {
	readonly config: BuiltGlobalConfig;
	defaultLocale: string | undefined;
	emptyDoc(): Doc;
	find(args?: { locale?: string; depth?: number }): Promise<Doc>;
	update(args: { data: Partial<Doc>; locale?: string }): Promise<Doc | { errors: FormErrors }>;
}
