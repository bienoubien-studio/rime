import type { EmailField, TextField } from "$lib/fields/types.js"
import { email as validateEmail } from "$lib/util/validate.js"
import type { ClientField } from '$lib/fields/types.js';

export const passwordField: ClientField<TextField> = {
  name: 'password',
  type: 'text',
  layout: 'compact',
  required: true,
  isEmpty: (value) => !value,
}

export const emailField: ClientField<EmailField> = {
  name: 'email',
  type: 'email',
  layout: 'compact',
  required: true,
  validate: validateEmail,
  isEmpty: (value) => !value,
}

export const nameField: ClientField<TextField> = {
  name: 'name',
  type: 'text',
  layout: 'compact',
  required: true,
  isEmpty: (value) => !value,
}