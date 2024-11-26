import type { ActionReturn } from "svelte/action";

export const classList = (
  node: HTMLElement,
  classes: string | string[]
): ActionReturn => {
  const tokens = Array.isArray(classes) ? classes : [classes];
  node.classList.add(...tokens);

  return {
    destroy() {
      node.classList.remove(...tokens);
    }
  };
};
