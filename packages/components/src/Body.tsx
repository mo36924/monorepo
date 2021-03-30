import { GraphQLScript } from "@mo36924/graphql-react";
import type { PropsWithChildren } from "react";

export const Body = (props: PropsWithChildren<{}>) => (
  <body>
    <div id="body">{props.children}</div>
    <GraphQLScript />
  </body>
);
