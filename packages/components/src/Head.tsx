import type { PropsWithChildren } from "react";

export const Head = ({ children, ...props }: PropsWithChildren<JSX.IntrinsicElements["head"]>) => (
  <head {...props}>{children}</head>
);
