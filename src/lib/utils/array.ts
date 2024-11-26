export const moveItem = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  const copy = [...arr];
  const element = copy[fromIndex];
  copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, element);
  return copy;
};
