import create from './create.server.js';
import deleteDocs from './delete.server.js';
import deleteById from './deleteById.server.js';
import duplicate from './duplicate.server.js';
import get from './get.server.js';
import getById from './getById.server.js';
import updateById from './updateById.server.js';

const operations = { get, getById, deleteById, delete: deleteDocs, create, updateById, duplicate };

export default operations;
