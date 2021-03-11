import type { Options } from "./type";

export type { Execute, ExecutionResult, FormattedExecutionResult, GraphQLParams, Options, Send } from "./type";

export default async (options: Options) => {
  const mod = await (process.env.NODE_ENV === "production" ? import("./graphql") : import("./graphiql"));
  const middleware = await mod.default(options);
  return middleware;
};
