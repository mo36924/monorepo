import type { ComponentChildren } from "preact";

export const Html = (props: { lang?: string; children?: ComponentChildren }) => {
  document.documentElement.lang = props.lang || "";
  return <>{props.children}</>;
};
