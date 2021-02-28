import {
  defaultFieldResolver,
  defaultTypeResolver,
  DocumentNode,
  getOperationRootType,
  GraphQLError,
  GraphQLSchema,
} from "graphql";
import { buildExecutionContext } from "graphql/execution/execute";
import { Fields, resolve } from "./resolve";

export type { Args, Directives, Field, Fields, Types } from "./resolve";

export type QueryResult =
  | {
      data: { Query?: Fields; Mutation?: Fields; Subscription?: Fields };
      errors?: undefined;
    }
  | {
      data?: undefined;
      errors: readonly GraphQLError[];
    };

export default (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any } | null,
  operationName?: string | null,
): QueryResult => {
  const context = buildExecutionContext(
    schema,
    document,
    {},
    {},
    variables,
    operationName,
    defaultFieldResolver,
    defaultTypeResolver,
  );

  if ((Array.isArray as (value: any) => value is readonly any[])(context)) {
    return { errors: context };
  }

  const operation = context.operation;
  const rootType = getOperationRootType(schema, operation);
  const result = resolve(context, rootType, operation.selectionSet, Object.create(null));
  return { data: result };
};
