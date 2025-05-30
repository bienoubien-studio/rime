/**
 * Moves an item from one position to another within an array.
 * Creates a new array instead of modifying the original.
 * 
 * @param arr - The source array to move items within
 * @param fromIndex - The index of the item to move
 * @param toIndex - The destination index where the item should be placed
 * @returns A new array with the item moved to the new position
 * 
 * @example
 * // Move the second item to the fourth position
 * const newArray = moveItem(['a', 'b', 'c', 'd', 'e'], 1, 3);
 * // Result: ['a', 'c', 'd', 'b', 'e']
 */
export const moveItem = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  const copy = [...arr];
  const element = copy[fromIndex];
  copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, element);
  return copy;
};
