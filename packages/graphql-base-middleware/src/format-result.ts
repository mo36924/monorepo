import { formatError } from "graphql";
import type { ExecutionResult, FormattedExecutionResult } from "./type";

export const formatResult = (result: ExecutionResult): FormattedExecutionResult => {
  if (result.errors && result.errors.length > 0) {
    result.errors = result.errors.map(formatError) as any;
  }

  return result;
};
