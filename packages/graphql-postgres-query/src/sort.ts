import type { Types } from "@mo36924/graphql-schema";

export type Queries = [typeName: string, id: string, query: string][];

export default (types: Types, queries: Queries) => {
  const typeNames = Object.keys(types);
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
