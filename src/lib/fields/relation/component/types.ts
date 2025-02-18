import type { CompiledCollectionConfig } from 'rizom/types/config';
import type { GenericDoc } from 'rizom/types/doc';

export type RelationFieldItem = {
	relationId: string;
	label: string;
	filename?: string;
	filesize?: string;
	mimeType?: string;
	isImage?: boolean;
	imageURL?: string;
	livePreview?: GenericDoc;
};

export type RelationComponentProps = {
	isFull: boolean;
	path: string;
	hasError: boolean;
	addValue: (relationId: string) => void;
	removeValue: (relationId: string) => void;
	items: RelationFieldItem[];
	readOnly: boolean;
	nothingToSelect: boolean;
	many: boolean;
	selectedItems: RelationFieldItem[];
	relationConfig: CompiledCollectionConfig;
	onOrderChange: (oldIndex: number, newIndex: number) => void;
	formNestedLevel: number;
	onRelationCreated: any;
};
