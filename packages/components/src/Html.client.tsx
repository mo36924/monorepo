import type { PropsWithChildren } from "react";

export const Html = (props: PropsWithChildren<{ lang?: string }>) => {
  document.documentElement.lang = props.lang || "";
  return <>{props.children}</>;
};
