import type { PropsWithChildren } from "react";

export const Body = (props: PropsWithChildren<{}>) => (
  <body>
    <div id="body">{props.children}</div>
  </body>
);
