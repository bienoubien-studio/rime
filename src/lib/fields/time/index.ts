import type { FormField } from '$lib/types/fields.js';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/bin/generate/schema/templates.js';
import TimeComponent from './component/Time.svelte';

export const time = (name: string) => new TimeFieldBuilder(name);

class TimeFieldBuilder extends FormFieldBuilder<TimeField> {
  //
  constructor(name: string) {
    super(name, 'time');
    this.field.defaultValue = '08:00'
    this.field.validate = (value) => {
      if(typeof value === 'string' && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)){
        return true
      }
      return 'incorrect time format ' + value
    }
  }

  get component() {
    return TimeComponent;
  }
  
  toType() {
    return `${this.field.name}${!this.field.required ? '?' : ''}: string`;
  }

  toSchema(parentPath?: string) {
    const { camel, snake } = this.getSchemaName(parentPath);
    const suffix = templateUniqueRequired(this.field);
    return `${camel}: text('${snake}')${suffix}`;
  }

  defaultValue(value: string) {
    this.field.defaultValue = value;
    return this;
  }
}

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type TimeField = FormField & {
  type: 'time';
  defaultValue?: string | (() => string);
  unique?: boolean;
  isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
  interface RegisterFieldsType {
    time: any;
  }
  interface RegisterFormFields {
    TimeField: TimeField; // register the field type
  }
}
