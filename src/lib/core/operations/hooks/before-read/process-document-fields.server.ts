import type { GenericBlock } from '$lib/core/types/doc.js';
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from '$lib/util/object.js';
import { buildConfigMap } from '../../configMap/index.server.js';
import { Hooks } from '../index.js';

export const processDocumentFields = Hooks.beforeRead( async (args) => {
	const { event } = args;
	let doc = args.doc;
  
	const configMap = buildConfigMap(doc, args.config.fields);
	
	for (const [key, config] of Object.entries(configMap)) {

		if(config.type === 'blocks'){
			const value = getValueAtPath<(GenericBlock | undefined)[]>(key, doc);
			// Filter out possible undefined block or residual
			// Case undefined : When in dev mode, if a block table is deleted in a migration, a blocks array value could includes undefined ex : 
			// * blocks: [ { ... }, undefined, { ... } ]
			// * Because blocks are populated based on path.position
			// Case residual : a block type has been removed but was including a relation, this gives ex :
			// * blocks: [ { id:..., values,... }, { image: {...}} ] 
			// * the image has been placed but the block doesn't exist anymore
			if( value ){
				const withoutResidualBlock = value
					.filter( b => b && 'id' in b) // get only blocks that have .id
					.map( (b, index) => ({
					...b,
					position: index
				}))
				doc = setValueAtPath(key, doc, withoutResidualBlock)
			}
		}

		if (config.access && config.access.read) {
			const authorized = config.access.read(event.locals.user);
			if (!authorized) {
				doc = deleteValueAtPath(doc, key);
				continue;
			}
		}

		if (config.hooks?.beforeRead) {
			let value = getValueAtPath(key, doc);
			if (value) {
				for (const hook of config.hooks.beforeRead) {
					value = await hook(value, { event, config, operation: args.context, documentId: doc.id });
					doc = setValueAtPath(key, doc, value);
				}
			}
		}
	}

	
	return { ...args, doc };
});
