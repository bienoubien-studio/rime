import { normalizeFieldPath } from '$lib/util/doc.js';
import { expect, test } from 'vitest';

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
