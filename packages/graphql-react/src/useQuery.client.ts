import { get, querystring } from "@mo36924/graphql";
import type { FormattedExecutionResult } from "graphql";
import { useEffect, useState } from "react";
import { cache } from "./cache";

export const useQuery = (args: {
  query: string;
  variables?: { [key: string]: any } | null;
}): FormattedExecutionResult & { loading?: boolean } => {
  const qs = querystring(args);
  const [result, setResult] = useState(cache[qs]);

  useEffect(() => {
    result || get(qs).then(setResult);
  }, [result, qs]);

  return result || { loading: true };
};
