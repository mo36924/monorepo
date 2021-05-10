import { exists } from "./util";

export type StyleProps = {
  id?: string;
  className?: string;
  media?: string;
  nonce?: string;
  scoped?: boolean;
  type?: string;
  children?: string;
};

export const Style = ({ children = "", ...props }: StyleProps) => {
  if (!exists(props.id)) {
    const style = Object.assign(document.createElement("style"), props);
    style.appendChild(document.createTextNode(children));
    document.head.appendChild(style);
  }

  return null;
};
