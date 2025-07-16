/**
 * Utility module for Rizom headless CMS.
 * Provides a collection of helper functions and utilities used throughout the application.
 *
 * This module exports various utility categories:
 * - access: User permission and role checking utilities
 * - array: Array manipulation functions
 * - file: File system and file handling utilities
 * - config: Configuration processing utilities
 * - doc: Document manipulation and processing utilities
 * - field: Field definition and handling utilities
 * - object: Object manipulation and processing utilities
 * - random: Random value generation utilities
 * - state: State management utilities
 * - string: String manipulation utilities
 * - validate: Validation utilities
 */
import * as array from './array.js';
import * as doc from './doc.js';
import * as config from './config.js';
import * as field from './field.js';
import * as object from './object.js';
import * as random from './random.js';
import * as state from './state.js';
import * as string from './string.js';
import * as validate from './validate.js';
import * as file from './file.js';
import { access } from './access/index.js';

export { access, array, file, config, doc, field, object, random, state, string, validate };
