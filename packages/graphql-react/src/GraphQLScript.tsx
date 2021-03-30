import { text } from "@mo36924/escape";
import { stringify } from "@mo36924/graphql-json";
import { useContext } from "react";
import { context } from "./context";

export const GraphQLScript = () => (
  <script
    id="graphql"
    type="application/json"
    dangerouslySetInnerHTML={{ __html: text(stringify(useContext(context))) }}
  />
);
