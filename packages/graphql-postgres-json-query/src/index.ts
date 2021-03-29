import graphqlQuery from "@mo36924/graphql-query";
import { DocumentNode, GraphQLError, GraphQLSchema } from "graphql";
import type { Context } from "./context";
import mutation from "./mutation";
import query from "./query";

export type PostgresQueryResult =
  | { data: string[]; errors?: undefined }
  | { data?: undefined; errors: readonly GraphQLError[] };

export default (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any } | null,
  operationName?: string | null,
): PostgresQueryResult => {
  const result = graphqlQuery(schema, document, variables, operationName);

  if (result.errors) {
    return result;
  }

  const { Query, Mutation } = result.data;
  const context: Context = { schema, id: 0, date: new Date() };

  if (Query) {
    return { data: query(context, Query) };
  } else if (Mutation) {
    return { data: mutation(context, Mutation) };
  } else {
    return { errors: [new GraphQLError("Not support Subscription query")] };
  }
};
