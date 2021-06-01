import { GraphQLScript } from "@mo36924/graphql-preact";
import type { ComponentChildren } from "preact";

export const Body = (props: { children?: ComponentChildren }) => (
  <body>
    <div id="body">{props.children}</div>
    <GraphQLScript />
  </body>
);
