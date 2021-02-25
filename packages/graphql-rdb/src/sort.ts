import type { Types } from "@mo36924/graphql-schema";
import { GraphQLSchema, isObjectType } from "graphql";

export type Queries = [typeName: string, id: string, query: string][];

export default (schema: GraphQLSchema, queries: Queries) => {
  const typeNames: string[] = [];

  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type) && type.name !== "Query" && type.name !== "Mutation" && type.name !== "Subscription") {
      typeNames.push(type.name);
    }
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
