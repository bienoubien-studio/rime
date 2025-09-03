import create from './create.js';
import deleteDocs from './delete.js';
import deleteById from './deleteById.js';
import duplicate from './duplicate.js';
import get from './get.js';
import getById from './getById.js';
import updateById from './updateById.js';

const operations = { get, getById, deleteById, delete: deleteDocs, create, updateById, duplicate };

export default operations;
