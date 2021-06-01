import { parse } from "@mo36924/graphql-json";
import type { FormattedExecutionResult } from "graphql";

const _fetch = (url: RequestInfo, init?: RequestInit): Promise<FormattedExecutionResult> =>
  fetch(url, init)
    .then((res) => res.text())
    .then((text) => parse(text))
    .catch((error) => ({
      errors: [{ message: "" + error }],
    }));

export { _fetch as fetch };
