import { DocumentNode, GraphQLSchema, validate as _validate } from "graphql";
import { memoize2 } from "./memoize2";

export const validate = memoize2(
  (schema: GraphQLSchema, documentNode: DocumentNode) => _validate(schema, documentNode),
  new WeakMap(),
);
