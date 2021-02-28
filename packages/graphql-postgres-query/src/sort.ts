import type { GraphQLSchema } from "graphql";

export type Queries = [typeName: string, id: string, query: string][];

const cacheTypeNames = new WeakMap<GraphQLSchema, string[]>();

export default (schema: GraphQLSchema, queries: Queries) => {
  let typeNames = cacheTypeNames.get(schema)!;

  if (!typeNames) {
    typeNames = Object.keys(schema.getTypeMap());
    cacheTypeNames.set(schema, typeNames);
  }

  return queries
    .slice()
    .sort((a, b) => {
      const sortKeyA = typeNames.indexOf(a[0]);
      const sortKeyB = typeNames.indexOf(b[0]);
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
