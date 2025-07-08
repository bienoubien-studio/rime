import getById from './getById.js';
import deleteById from './deleteById.js';
import deleteDocs from './delete.js';
import create from './create.js';
import get from './get.js';
import updateById from './updateById.js';

const operations = { get, getById, deleteById, delete: deleteDocs, create, updateById };

export default operations
