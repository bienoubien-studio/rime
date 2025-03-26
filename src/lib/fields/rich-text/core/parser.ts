/**
 * Parses a shortcut config string format for rich text editor configuration
 * Format: '[ node1 | node2 | node3 ] mark1 | mark2 | extras'
 * 
 * @param shortcutConfig - The shortcut config string to parse
 * @returns An object with nodes, marks arrays and hasAnchor boolean
 * 
 * @example
 * parseShortcutConfig('[ p | h1 | h2 | quote ] b | s | u | h | a')
 * // Returns { nodes: ['p', 'h1', 'h2', 'quote'], marks: ['b', 's', 'u'], hasAnchor: true }
 */
export function parseShortcutConfig(shortcutConfig: string): { 
  nodes: string[], 
  marks: string[], 
  hasAnchor: boolean 
} {
  // Remove all spaces for consistent parsing
  const cleanConfig = shortcutConfig.replace(/\s+/g, '');
  
  // Extract nodes (content inside brackets)
  const nodesMatch = cleanConfig.match(/\[(.*?)\]/);
  const nodesString = nodesMatch ? nodesMatch[1] : '';
  const nodes = nodesString ? nodesString.split('|').filter(Boolean) : [];
  
  // Extract marks and extras (content after closing bracket)
  const afterBracketString = cleanConfig.replace(/\[.*?\]/, '').trim();
  const afterBracketItems = afterBracketString ? afterBracketString.split('|').filter(Boolean) : [];
  
  // Check if 'a' is present for anchor
  const hasAnchor = afterBracketItems.includes('a');
  
  // Filter out 'a' from marks
  const marks = afterBracketItems.filter(item => item !== 'a');
  
  return { nodes, marks, hasAnchor };
}