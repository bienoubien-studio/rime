import { normalizeFieldPath } from '$lib/util/doc.js';
import { expect, test } from 'vitest';
import { getFieldConfigByPath } from './util.js';

test('should return bar.0.foo', () => {
	const res = normalizeFieldPath('bar.0:booz.foo');
	expect(res).toBe('bar.0.foo');
});

test('should return bar.0.foo.4.baz', () => {
	const res = normalizeFieldPath('bar.0:hello.foo.4:guys.baz');
	expect(res).toBe('bar.0.foo.4.baz');
});

test('should return bar.0.foo.4.baz', () => {
	const res = normalizeFieldPath('bar.0.foo.4.baz');
	expect(res).toBe('bar.0.foo.4.baz');
});

test('should return bar.0.Foo12.4.baz', () => {
	const res = normalizeFieldPath('bar.0:3someCase.Foo12.4.baz');
	expect(res).toBe('bar.0.Foo12.4.baz');
});

test('should return correct config', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('hero.heroType', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('heroType');
});

test('should return correct block field config', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('layout.components.0.text', fields, {
		inBlockType: 'paragraph'
	});
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('text');
	expect(field?.type).toBe('richText');
});

test('should return correct title field config', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('attributes.title', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('title');
	expect(field?.type).toBe('text');
});

test('should return correct field config inside group', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('attributes.group.ok', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('ok');
	expect(field?.type).toBe('toggle');
});

test('should return correct field config inside tree', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('footer.nav.0.label', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('label');
	expect(field?.type).toBe('text');
});

test('should return correct field config inside tree 2', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('footer.nav.0.link', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('link');
	expect(field?.type).toBe('link');
});

test('should return correct field config inside tree inside group', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('footer.nav.0.group.metaTitle', fields);
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('metaTitle');
	expect(field?.type).toBe('text');
});

test('should return correct field config inside blocks inside tree', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('layout.components.0.legends.0.legend', fields, {
		inBlockType: 'slider'
	});
	expect(field).toBeDefined();
	expect(field?.name).toBeDefined();
	expect(field?.name).toBe('legend');
	expect(field?.type).toBe('text');
});

test('should not return field config inside blocks without param inBlockType', () => {
	//@ts-expect-error no need for field.access prop for testing this
	const field = getFieldConfigByPath('layout.components.0.legends.0.legend', fields);
	expect(field).toBe(undefined);
});
