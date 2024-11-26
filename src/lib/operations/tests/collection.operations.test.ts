import { describe, expect, it } from 'vitest';
import rizom from '$lib/rizom.server.js';
import { LocalAPI } from '../localAPI/index.server.js';

describe('Test operations', async () => {
	await rizom.init();

	const api = new LocalAPI({ rizom });
	api.grantAdminPrivilege();
	let docId: string;

	it('should create a page and return correct page data', async () => {
		const page = await api.collection('pages').create<any>({
			data: {
				title: 'Home',
				slug: 'home',
				components: [
					{
						text: { content: [{ type: 'paragraph', text: 'Foo' }] },
						type: 'paragraph'
					},
					{
						type: 'image',
						legend: 'legend'
					}
				]
			}
		});

		expect(page.doc).toBeDefined();
		expect(page.doc?.id).toBeDefined();

		docId = page.doc?.id || '';

		expect(page.doc?.title).toBe('Home');
		expect(page.doc?.slug).toBe('home');
		expect(page.doc?.components).toBeDefined();
		expect(page.doc?.components.length).toBe(2);
		expect(page.doc?.components.at(0).text).toBe('Foo');
	});

	it('should get page created', async () => {
		const doc = await api.collection('pages').findById({ id: docId });

		expect(doc).toBeDefined();
		expect(doc?.title).toBe('Home');
		expect(doc?.slug).toBe('home');
		expect(doc?.components).toBeDefined();
		expect(doc?.components.length).toBe(2);
		expect(doc?.components.at(0).text).toBe('Foo');
	});
});
