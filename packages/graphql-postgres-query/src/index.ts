import resolveQuery from "@mo36924/graphql-query";
import type { DocumentNode, GraphQLError, GraphQLSchema, OperationTypeNode } from "graphql";
import mutation from "./mutation";
import query from "./query";

export type Result = { operation: OperationTypeNode; data?: string[]; errors?: readonly GraphQLError[] };

export default (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any } | null,
  operationName?: string | null,
): Result => {
  const { Query, Mutation } = resolveQuery(schema, document, variables, operationName);

  if (Query) {
    return { data: query(Query), operation: "query" };
  } else if (Mutation) {
    return { data: mutation(schema, Mutation), operation: "mutation" };
  } else {
    return { errors: [], operation: "subscription" };
  }
};
