import { memoize2 } from "@mo36924/memoize";
import { DocumentNode, GraphQLSchema, validate as _validate } from "graphql";

export const validate = memoize2(
  (schema: GraphQLSchema, documentNode: DocumentNode) => _validate(schema, documentNode),
  new WeakMap(),
);
