
// Auth types
export type { Access, User } from './core/collections/auth/types.js';

// Config types
export type {
	BrowserConfig,
	BuiltCollection,
	CompiledCollection,
	BuiltConfig,
	BuiltArea,
	CompiledArea,
	Collection,
	Config,
	CustomPanelRoute,
	Area,
	ImageSizesConfig,
	LocaleConfig,
	LocalizationConfig,
	PanelUsersConfig,
	RouteConfig,
	CollectionHooks,
	AreaHooks
} from './core/config/types/index.js';

// Doc types
export type {
	BaseDoc,
	AreaSlug,
	CollectionSlug,
	Prototype,
	GenericBlock,
	GenericDoc,
	PrototypeSlug,
	UploadDoc
} from './core/types/doc.js';

// Fields types
export type { Field, FormField, Option, RelationValue } from '$lib/fields/types.js';

// // Hooks types
// export type {
// } from './core/config/types/index.js';

// Panel types
export type { CollectionProps, FieldPanelTableConfig, FormErrors, Route } from './panel/types.js';

export type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte.js';

// Upload types
export type { JsonFile } from './core/collections/upload/upload.js';
export type { Link } from './fields/link/types.js';

// Util
export type { WithRelationPopulated } from '$lib/util/types.js';

export type { Plugin, Plugins } from './core/types/plugins.js';
export type { Rizom } from './core/rizom.server.js';
export type { RichTextFeatureNode, RichTextFeatureMark, RichTextFeature } from './fields/rich-text/core/types.js';
export type { BlocksFieldBlockRenderTitle } from './fields/blocks/index.js';
