import { DocumentNode, getOperationRootType, GraphQLSchema } from "graphql";
import { Context, createContext } from "./context";
import { Fields, resolve } from "./resolve";

export type { Args, Directives, Field, Fields, Types } from "./resolve";

export type ResolveQuery = {
  Query?: Fields;
  Mutation?: Fields;
  Subscription?: Fields;
};

export default (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any } | null,
  operationName?: string | null,
): ResolveQuery => {
  const context = createContext(schema, document, variables, operationName);
  const operation = context.operation;
  const rootType = getOperationRootType(schema, operation);
  const resolveQuery = resolve(context, rootType, operation.selectionSet, Object.create(null));
  return resolveQuery;
};
