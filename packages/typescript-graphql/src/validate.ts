import { DocumentNode, GraphQLError, GraphQLSchema, validate as _validate } from "graphql";

const schemaCache = new WeakMap<GraphQLSchema, WeakMap<DocumentNode, readonly GraphQLError[]>>();

export const validate = (schema: GraphQLSchema, documentNode: DocumentNode) => {
  let cache = schemaCache.get(schema);

  if (!cache) {
    cache = new WeakMap();
    schemaCache.set(schema, cache);
  }

  let errors = cache.get(documentNode);

  if (errors) {
    return errors;
  }

  errors = _validate(schema, documentNode);
  cache.set(documentNode, errors);
  return errors;
};
