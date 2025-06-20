<script lang="ts">
  import type { Snippet } from "svelte";
  import { ContextMenu, type ContextMenuItemProps, type WithoutChild } from "bits-ui";
  import './context-menu-item.css'

  type Props = ContextMenuItemProps & {
    children: Snippet;
  };
  let {
    children,
    ...restProps
  }: Props = $props();
</script>
 
<ContextMenu.Item class="rz-context-menu-item" {...restProps}>
  {@render children()}
</ContextMenu.Item>