
type Field = {
  value: any;
  readonly editable: boolean;
  readonly visible: boolean;
  readonly error: string | false;
}

export function root(node: HTMLElement, field: Field) {
  node.classList.add('rz-field-root');

  $effect(() => {
    if (field.visible) {
      node.setAttribute('data-visible', '');
    } else {
      node.removeAttribute('data-visible');
    }
  })
  
  $effect(() => {
    if (!field.editable) {
      node.setAttribute('disabled', '');
    } else {
      node.removeAttribute('disabled');
    }
  })
}
