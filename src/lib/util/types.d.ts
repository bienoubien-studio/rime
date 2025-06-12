import type { FieldBuilder } from '$lib/fields/builders';
import type { Field } from './fields';
import type { GenericDoc, ImageSizesConfig, RelationValue } from '$lib/types';
import type { UploadConfig } from '$lib/core/config/types/index.js';

export type OmitPreservingDiscrimination<T, K extends keyof T> = T extends any ? Omit<T, K> : never;
export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
export type Pretty<T> = {
	[K in keyof T]: T[K];
} & {};
export type Dic = Record<string, any>;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R>
	? R
	: any;

type AnyFunction = (...args: any[]) => any;

type WithUpload<T extends { upload?: UploadConfig }> = T & {
	upload: UploadConfig;
};

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<Required<T>[P]> : T[P];
};

export type WithRelationPopulated<T> = {
	[K in keyof T]: // Check for primitive types first
	Required<T>[K] extends string
		? T[K]
		: Required<T>[K] extends number
			? T[K]
			: Required<T>[K] extends boolean
				? T[K]
				: Required<T>[K] extends null
					? T[K]
					: T[K] extends undefined
						? undefined
						: // Then check for relation values
							NonNullable<T[K]> extends RelationValue<infer U>
							? T[K] extends undefined
								? undefined
								: U[]
							: T[K] extends Array<infer E>
								? Array<WithRelationPopulated<E>>
								: T[K] extends object
									? WithRelationPopulated<T[K]>
									: T[K];
};

export type WithoutBuilders<T> =
	T extends Array<infer U>
		? U extends FieldBuilder<any>
			? Field[]
			: Array<WithoutBuilders<U>>
		: T extends { fields: FieldBuilder<any>[] }
			? Omit<T, 'fields'> & { fields: Field[] }
			: T extends { tabs: Array<{ fields: FieldBuilder<any>[] }> }
				? Omit<T, 'tabs'> & {
						tabs: Array<
							Omit<T['tabs'][number], 'fields'> & {
								fields: Field[];
							}
						>;
					}
				: T extends { blocks: Array<{ fields: FieldBuilder<any>[] }> }
					? Omit<T, 'blocks'> & {
							blocks: Array<
								Omit<T['blocks'][number], 'fields'> & {
									fields: Field[];
								}
							>;
						}
					: T extends Function
						? T
						: T extends object
							? { [K in keyof T]: WithoutBuilders<T[K]> }
							: T;
