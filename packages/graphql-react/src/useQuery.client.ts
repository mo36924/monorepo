import { get, querystring } from "@mo36924/graphql";
import type { FormattedExecutionResult } from "graphql";
import { useEffect, useState } from "react";
import { cache } from "./cache";

export type GraphQLArgs<T = { variables?: { [key: string]: any } | null }> = { query: string } & T;
export type GraphQLTypeArgs = { $values?: any; $variables?: any; $result?: any };
export type UseQueryResult<T = { [key: string]: any }> = FormattedExecutionResult<T> & { loading?: boolean };
export type UseQuery = {
  <T extends GraphQLArgs & GraphQLTypeArgs>(
    args: T extends { $variables: { [key: string]: any } } ? GraphQLArgs<{ variables: T["$variables"] }> : GraphQLArgs,
  ): UseQueryResult<T extends { $result: any } ? T["$result"] : { [key: string]: any }>;
  <T extends readonly string[] & GraphQLTypeArgs>(
    strings: T,
    ...values: T extends { $values: any } ? T["$values"] : never
  ): UseQueryResult<T extends { $result: any } ? T["$result"] : never>;
};

export const useQuery: UseQuery = (args: GraphQLArgs) => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && Array.isArray(args)) {
    throw new TypeError("Invalid arguments");
  }

  const qs = querystring(args);
  const [result, setResult] = useState(cache[qs]);

  useEffect(() => {
    result || get(qs).then(setResult);
  }, [result, qs]);

  return result || { loading: true };
};
