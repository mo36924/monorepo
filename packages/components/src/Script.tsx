import type { PropsWithChildren } from "react";

export const Script = ({ children, ...props }: PropsWithChildren<JSX.IntrinsicElements["script"]>) => (
  <script {...props}></script>
);
