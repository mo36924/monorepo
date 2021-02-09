import {
  buildSchema,
  DocumentNode,
  getOperationRootType,
  GraphQLSchema,
  NoSchemaIntrospectionCustomRule,
  parse,
  specifiedRules,
  validate,
} from "graphql";
import { assertValidExecutionArguments } from "graphql/execution/execute";
import { createContext } from "./context";
import { GraphQLErrors } from "./errors";
import { Fields, resolve } from "./resolve";

export type { Args, Directives, Field, Fields, Types } from "./resolve";

export type ResolveQuery = {
  Query?: Fields;
  Mutation?: Fields;
  Subscription?: Fields;
};

export default (
  schema: string | GraphQLSchema,
  query: string | DocumentNode,
  variables: { [key: string]: any } = {},
  operationName?: string,
): ResolveQuery => {
  if (typeof schema === "string") {
    schema = buildSchema(schema);
  }

  if (typeof query === "string") {
    query = parse(query);
  }

  const validationErrors = validate(schema, query, [...specifiedRules, NoSchemaIntrospectionCustomRule]);

  if (validationErrors.length > 0) {
    throw new GraphQLErrors("Validation errors.", validationErrors);
  }

  assertValidExecutionArguments(schema, query, variables);
  const context = createContext(schema, query, variables, operationName);
  const operation = context.operation;
  const type = getOperationRootType(schema, operation);
  const types = resolve(context, type, operation.selectionSet, Object.create(null));
  return types;
};
