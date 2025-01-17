import type { FieldsComponents } from 'rizom/types/panel';
import * as builders from './index.js';

const componentsMap: Record<string, FieldsComponents> = {};

Object.values(builders).forEach((builder: any) => {
	// Create dummy arguments based on the function's expected parameter count
	const dummyArgs = Array(builder.length).fill('dummy');

	try {
		const instance = builder(...dummyArgs);
		if (instance.component) {
			componentsMap[instance.type] = {
				component: instance.component,
				cell: instance.cell
			};
		}
	} catch (e) {
		// Skip if the builder throws an error with dummy args
		console.warn(`Skipping builder: ${builder.name}`);
	}
});

export { componentsMap };
