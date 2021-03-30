import { get, querystring } from "@mo36924/graphql";
import type { FormattedExecutionResult } from "graphql";
import { useContext } from "react";
import { context } from "./context";

export const useQuery = (args: { query: string; variables: any }): FormattedExecutionResult & { loading?: boolean } => {
  const graphql = useContext(context);
  const qs = querystring(args);
  const result = graphql[qs] || (graphql[qs] = get(qs).then((result) => (graphql[qs] = result)));

  if (result.then) {
    throw result;
  }

  return result || { loading: true };
};
