import type { ServerResponse } from "http";
import type { GraphiQLData, GraphiQLOptions } from "express-graphql/renderGraphiQL";
import type { FormattedExecutionResult, GraphQLParams } from "./type";

export const respondWithGraphiQL = async (
  res: ServerResponse,
  options?: GraphiQLOptions,
  params?: GraphQLParams,
  result?: FormattedExecutionResult,
) => {
  const data: GraphiQLData = {
    query: params?.query,
    variables: params?.variables,
    operationName: params?.operationName,
    result: result?.raw === undefined ? result : JSON.parse(result.raw),
  };

  const { renderGraphiQL } = await import("express-graphql/renderGraphiQL.js");
  const payload = renderGraphiQL(data, options);
  const chunk = Buffer.from(payload, "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Length", chunk.length.toString());
  res.end(chunk);
};
