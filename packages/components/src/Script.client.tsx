import { exists, getHref } from "./util";

export type ScriptProps = {
  id?: string;
  className?: string;
  async?: boolean;
  crossOrigin?: string;
  defer?: boolean;
  integrity?: string;
  noModule?: boolean;
  nonce?: string;
  src?: string;
  type?: string;
  children?: string;
};

export const Script = ({ children = "", ...props }: ScriptProps) => {
  let href: string | undefined;

  if (
    !exists(props.id) &&
    (href = getHref(props.src)) &&
    ![...document.scripts].some((script) => script.src === href)
  ) {
    document.head.appendChild(Object.assign(document.createElement("script"), props, { text: children }));
  }

  return null;
};
