import { exists, getHref } from "./util";

export type LinkProps = {
  id?: string;
  className?: string;
  as?: string;
  crossOrigin?: string;
  href: string;
  hrefLang?: string;
  integrity?: string;
  media?: string;
  rel: string;
  sizes?: string;
  type?: string;
  charSet?: string;
};

export const Link = (props: LinkProps) => {
  let href: string | undefined;

  if (
    !exists(props.id) &&
    (href = getHref(props.href)) &&
    ![...document.getElementsByTagName("link")].some((link) => link.href === href)
  ) {
    document.head.appendChild(Object.assign(document.createElement("link"), props));
  }

  return null;
};
