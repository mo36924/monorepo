import type { Options } from "./type";

export type { Execute, ExecutionResult, FormattedExecutionResult, GraphQLParams, Options, Send } from "./type";

export default async (options: Options) => {
  const mod = await (options.graphiql ? import("./graphiql") : import("./graphql"));
  const middleware = await mod.default(options);
  return middleware;
};
