import type { CompiledCollection } from 'rizom/types/config';
import type { GenericDoc } from 'rizom/types/doc';

export type RelationFieldItem = {
	id?: string;
	relationId: string;
	label: string;
	filename?: string;
	filesize?: string;
	mimeType?: string;
	isImage?: boolean;
	imageURL?: string;
	livePreview?: GenericDoc;
	editUrl: string;
};

export type RelationComponentProps = {
	path: string;
	relationConfig: CompiledCollection;
	stamp: string;
	hasError: boolean;
	isFull: boolean;
	readOnly: boolean;
	nothingToSelect: boolean;
	many: boolean;
	addValue: (relationToId: string) => void;
	removeValue: (relationToId: string) => void;
	availableItems: RelationFieldItem[];
	selectedItems: RelationFieldItem[];
	formNestedLevel: number;
	onOrderChange: (oldIndex: number, newIndex: number) => void;
	onRelationCreated: (doc: GenericDoc) => void;
	onRelationCreationCanceled: () => void;
	onRelationCreation: () => void;
};
