import type { RequestEvent } from '@sveltejs/kit';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { Rizom } from 'rizom/rizom.server.js';
import type {
	BuiltCollection,
	BuiltArea,
	CompiledCollection,
	CompiledArea
} from 'rizom/types/config';
import type { FormErrors } from './panel';
import type { RegisterCollection, RegisterArea } from 'rizom';

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

	area<Slug extends keyof RegisterArea>(slug: Slug): LocalAPIAreaInterface<RegisterArea[Slug]>;

	enforceLocale(locale: string): void;
	createFirstPanelUser({ name: string, email: string, password: string }): Promise<void>;

	readonly rizom: Rizom;
}

export type LocalAPIConstructorArgs = {
	rizom: Rizom;
	event: RequestEvent;
};

export interface LocalAPICollectionInterface<Doc extends GenericDoc = GenericDoc> {
	readonly config: CompiledCollection;
	defaultLocale: string | undefined;
	isAuth: boolean;

	blank(): Doc;
	create(args: { data: Partial<Doc>; locale?: string }): Promise<{ doc: Doc }>;

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

	findById(args: { id?: string; locale?: string; depth?: number }): Promise<Doc | null>;

	updateById(args: { id?: string; data: Partial<Doc>; locale?: string }): Promise<Doc>;

	deleteById(args: { id: string }): Promise<string>;
}

export interface LocalAPIAreaInterface<Doc extends GenericDoc = GenericDoc> {
	readonly config: CompiledArea;
	defaultLocale: string | undefined;
	blank(): Doc;
	find(args?: { locale?: string; depth?: number }): Promise<Doc>;
	update(args: { data: Partial<Doc>; locale?: string }): Promise<Doc | { errors: FormErrors }>;
}
