import type { FieldBuilder } from 'rizom/fields/_builders';

export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
export type Dic = Record<string, any>;
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
	...args: any
) => Promise<infer R>
	? R
	: any;

export type PublicBuilder<T> = Omit<
	InstanceType<T>,
	'component' | 'cell' | 'toType' | 'toSchema' | 'raw' | 'type' | 'name'
>;

type AnyFunction = (...args: any[]) => any;
type WithoutBuilders<T> =
	T extends Array<infer U>
		? Array<WithoutBuilders<U>>
		: // Handle fields arrays in blocks, tabs, etc.
			T extends { fields: Array<FieldBuilder<any>> }
			? Omit<T, 'fields'> & { fields: Array<AnyField> }
			: // Handle blocks field type specifically
				T extends { blocks: Array<{ fields: Array<FieldBuilder<any>> }> }
				? Omit<T, 'blocks'> & {
						blocks: Array<
							Omit<T['blocks'][number], 'fields'> & {
								fields: Array<AnyField>;
							}
						>;
					}
				: // Handle tabs field type specifically
					T extends { tabs: Array<{ fields: Array<FieldBuilder<any>> }> }
					? Omit<T, 'tabs'> & {
							tabs: Array<
								Omit<T['tabs'][number], 'fields'> & {
									fields: Array<AnyField>;
								}
							>;
						}
					: // Handle function types
						T extends AnyFunction
						? T
						: // Handle other object properties recursively
							T extends object
							? { [K in keyof T]: WithoutBuilders<T[K]> }
							: T;
