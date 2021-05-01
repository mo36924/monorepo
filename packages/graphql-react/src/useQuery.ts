import { get, querystring } from "@mo36924/graphql";
import { useContext } from "react";
import { context } from "./context";
import type { GraphQLArgs, UseQuery } from "./useQuery.client";

export type { GraphQLArgs, GraphQLTypeArgs, UseQuery, UseQueryResult } from "./useQuery.client";

export const useQuery: UseQuery = (args: GraphQLArgs) => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && Array.isArray(args)) {
    throw new TypeError("Invalid arguments");
  }

  const graphql = useContext(context);
  const qs = querystring(args);
  const result = graphql[qs] || (graphql[qs] = get(qs).then((result) => (graphql[qs] = result)));

  if (result.then) {
    throw result;
  }

  return result || { loading: true };
};
