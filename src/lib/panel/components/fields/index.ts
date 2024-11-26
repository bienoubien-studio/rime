import Blocks from './blocks/Blocks.svelte';
import BlocksCell from './blocks/Cell.svelte';
import Checkbox from './checkbox/Checkbox.svelte';
import Date from './date/Date.svelte';
import Combobox from './combobox/Combobox.svelte';
import DateCell from './date/Cell.svelte';
import Email from './email/Email.svelte';
import Link from './link/Link.svelte';
import Number from './number/Number.svelte';
import Radio from './radio/Radio.svelte';
import Relation from './relation/Relation.svelte';
import RichText from './richText/RichText.svelte';
import RichTextCell from './richText/Cell.svelte';
import Select from './select/Select.svelte';
import Separator from './separator/Separator.svelte';
import Slug from './slug/Slug.svelte';
import SlugCell from './slug/Cell.svelte';
import Tabs from './tabs/Tabs.svelte';
import Text from './text/Text.svelte';
import Toggle from './toggle/Toggle.svelte';
import Label from './Label.svelte';
import Error from './Error.svelte';
import Root from './Root.svelte';
import LabelFor from './LabelFor.svelte';
const Fields = {
	Blocks,
	Checkbox,
	Combobox,
	Date,
	Email,
	Link,
	Number,
	Radio,
	Relation,
	RichText,
	Select,
	Separator,
	Slug,
	Tabs,
	Text,
	Toggle
};
const FieldsCell = {
	BlocksCell,
	DateCell,
	RichTextCell,
	SlugCell
};
export type FieldsComponents = keyof typeof Fields;
export type FieldsCellComponents = keyof typeof FieldsCell;
export { Fields, FieldsCell };
export const Field = {
	Label,
	LabelFor,
	Error,
	Root
};
