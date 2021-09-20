import { memoize, createObject } from "@mo36924/util";
import type { GraphQLSchema } from "graphql";

export type Queries = [table: string, id: string, query: string][];

const getSortKeys = memoize(
  (schema: GraphQLSchema) =>
    createObject(Object.fromEntries(Object.keys(schema.getTypeMap()).map((name, i) => [name, i]))),
  new WeakMap(),
);

export const sortQueries = (schema: GraphQLSchema, queries: Queries) => {
  const sortKeys = getSortKeys(schema);

  return queries
    .slice()
    .sort((a, b) => {
      const sortKeyA = sortKeys[a[0]];
      const sortKeyB = sortKeys[b[0]];
      const idA = a[1];
      const idB = b[1];

      if (sortKeyA < sortKeyB) {
        return -1;
      }

      if (sortKeyA > sortKeyB) {
        return 1;
      }

      if (idA < idB) {
        return -1;
      }

      if (idA > idB) {
        return 1;
      }

      return 0;
    })
    .map((query) => query[2]);
};
