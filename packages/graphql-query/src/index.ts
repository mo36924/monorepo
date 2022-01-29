import { createObjectNull } from "@mo36924/util";
import { DocumentNode, getOperationRootType, GraphQLError, GraphQLSchema } from "graphql";
import { buildExecutionContext, ExecutionContext } from "graphql/execution/execute";
import { Fields, resolve } from "./resolve";

export * from "./field";

export type { Args, Directives, Field, Fields, Types } from "./resolve";

export type QueryResult =
  | {
      data: { Query?: Fields; Mutation?: Fields; Subscription?: Fields };
      extensions: { context: ExecutionContext };
      errors?: undefined;
    }
  | {
      errors: readonly GraphQLError[];
    };

export const buildQuery = (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any } | null,
  operationName?: string | null,
): QueryResult => {
  const context = buildExecutionContext({ schema, document, variableValues: variables, operationName });

  if ("length" in context) {
    return { errors: context };
  }

  const operation = context.operation;
  const rootType = schema.getRootType(operation.operation)!;
  const result = resolve(context, rootType, operation.selectionSet, createObjectNull());
  return { data: result, extensions: { context } };
};
