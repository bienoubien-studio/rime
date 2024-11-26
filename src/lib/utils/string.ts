import camelCase from 'camelcase';
import toSnakeCase from 'to-snake-case';

export { toSnakeCase };

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
export const toCamelCase = (str: string): string => camelCase(str);
export const toPascalCase = (str: string): string => camelCase(str, { pascalCase: true });

export const slugify = (text: string): string => {
  return text
    .toString() // Cast to string (optional)
    .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string (optional)
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-');
};
