import type { ContentUpdatePayload } from './types.js';

/**
 * In-memory SSE bus for broadcasting content updates.
 * @example
 * broadcast({  collection: 'events', id: '42', operation: 'update', timestamp: new Date().toISOString() });
 */


const clients = new Set<WritableStreamDefaultWriter<string>>();

export const registerWriter = (writer: WritableStreamDefaultWriter<string>): (() => void) => {
	clients.add(writer);
	return () => {
		clients.delete(writer);
	};
};

/**
 * Sends an SSE event to all connected clients.
 * @example
 * broadcast({  collection: 'events', id: '1', operation: 'update', timestamp: new Date().toISOString() });
 */
export const broadcast = (data: ContentUpdatePayload): void => {
	const frame = `event: rizom:${data.operation}\ndata: ${JSON.stringify(data)}\n\n`;
	for (const w of clients) {
		void w.write(frame).catch(() => {
			clients.delete(w);
		});
	}
};
