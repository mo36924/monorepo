import { parse, stringify } from "@mo36924/graphql-json";
import type { FormattedExecutionResult } from "graphql";

export type GraphQLArgs = {
  query: string;
  variables?: { [key: string]: any } | null;
  operationName?: string | null;
};

export { getBaseUrl, setBaseUrl } from "@mo36924/node-fetch-polyfill";

let endpoint = "/graphql";

export const getEndpoint = () => endpoint;

export const setEndpoint = (url: string) => {
  endpoint = url;
};

let jsonParse = parse;

export const getJsonParse = () => jsonParse;

export const setJsonParse = (parse: (data: string) => any) => {
  jsonParse = parse;
};

let jsonStringify = stringify;

export const getJsonStringify = () => jsonStringify;

export const setJsonStringify = (stringify: (data: any) => string) => {
  jsonStringify = stringify;
};

const _fetch = (url: RequestInfo, init?: RequestInit): Promise<FormattedExecutionResult> =>
  fetch(url, init)
    .then((res) => res.text())
    .then(jsonParse)
    .catch((error) => ({
      errors: [{ message: "" + error }],
    }));

export const get = (graphQLArgs: GraphQLArgs, init?: RequestInit) => {
  const params: any = { query: graphQLArgs.query };

  if (graphQLArgs.variables) {
    params.variables = jsonStringify(graphQLArgs.variables);
  }

  if (graphQLArgs.operationName != null) {
    params.operationName = graphQLArgs.operationName;
  }

  return _fetch(`${endpoint}?${new URLSearchParams(params)}`, {
    ...init,
    method: "GET",
  });
};

export const post = (
  graphQLArgs: {
    query: string;
    variables?: { [key: string]: any } | null;
    operationName?: string | null;
  },
  init?: RequestInit,
) =>
  _fetch(endpoint, {
    ...init,
    method: "POST",
    headers: { ...init?.headers, "content-type": "application/json" },
    body: jsonStringify(graphQLArgs),
  });
