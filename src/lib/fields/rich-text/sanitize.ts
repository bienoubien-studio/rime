import { sanitize } from '$lib/util/string.js';

// Helper function to sanitize JSONContent recursively
export const sanitizeJSONContent = (content: any): any => {
	if (!content) return content;

	// Handle text nodes - sanitize the text content
	if (content.type === 'text' && content.text) {
		return {
			...content,
			text: sanitize(content.text)
		};
	}

	// Skip sanitization for code blocks (preserve original content)
	if (content.type === 'codeBlock' || content.type === 'code') {
		return content;
	}

	// Recursively handle content array
	if (content.content && Array.isArray(content.content)) {
		return {
			...content,
			content: content.content.map(sanitizeJSONContent)
		};
	}

	return content;
};
