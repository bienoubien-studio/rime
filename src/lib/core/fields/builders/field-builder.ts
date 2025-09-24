import type { WithoutBuilders } from '$lib/util/types.js';
import type { Component } from 'svelte';
import type { Field } from '../../../fields/types.js';

export class FieldBuilder<T extends Field = Field> {
	field: T;
	_metaUrl?: string;

	constructor(type: string) {
		this.field = {
			type,
			live: true
		} as T;
	}

	className(str: string) {
		this.field.className = str;
		return this;
	}

	compile(): WithoutBuilders<T> {
		const compiled = {
			...this.field,
			component: this.component,
			cell: this.cell
		};
		return compiled as WithoutBuilders<T> & {
			component: typeof compiled.component;
			cell: typeof compiled.cell;
		};
	}

	live(bool: boolean) {
		this.field.live = bool;
		return this;
	}

	get type() {
		return this.field.type;
	}

	get raw(): T {
		return this.field;
	}

	get component(): Component<any> | null {
		return null;
	}

	get cell(): Component<{ value: any }> | null {
		return null;
	}

	// get(key: keyof T) {
	// 	return this.field[key];
	// }
}
