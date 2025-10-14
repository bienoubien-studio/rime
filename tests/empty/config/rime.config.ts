import { sqliteAdapter } from '$lib/adapter-sqlite/index.server';
import { rime } from '$rime/config';

export default rime({
	$adapter: sqliteAdapter('empty.sqlite')
});
