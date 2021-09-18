import type { DocumentNode, GraphQLError, GraphQLSchema } from "graphql";
import { buildExecutionContext, ExecutionContext } from "graphql/execution/execute";
import type { Maybe } from "graphql/jsutils/Maybe";
import { escape } from "./util";

export type Context = ExecutionContext & { ids?: { [table: string]: string[] }; date: Date; escapedDate: string };
export type MutationContext = Required<Context>;

export const buildContext = (
  schema: GraphQLSchema,
  document: DocumentNode,
  rawVariableValues: Maybe<{ [key: string]: any }>,
  operationName: Maybe<string>,
): Context | readonly GraphQLError[] => {
  const context = buildExecutionContext(
    schema,
    document,
    undefined,
    undefined,
    rawVariableValues,
    operationName,
    undefined,
    undefined,
  );

  if (!("schema" in context)) {
    return context;
  }

  const date = new Date();
  const escapedDate = escape(date);
  return Object.assign(context, { date, escapedDate });
};

export const buildMutationContext = (context: Context): Required<Context> => ({ ...context, ids: Object.create(null) });
