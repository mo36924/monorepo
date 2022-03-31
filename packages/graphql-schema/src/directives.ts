import { Directives, getDefDirectives, gql } from "@mo36924/graphql-utilities";
import { FieldDefinitionNode, ObjectTypeDefinitionNode, buildSchema } from "graphql";

export type TypeDirectives = { join?: {} };
export type FieldDirectives = {
  field?: { name: string; key: string };
  type?: { name: string; keys: [string, string] };
  key?: { name: string };
  ref?: { name: string };
  unique?: {};
};
export const modelDirectives = gql`
  directive @field(name: String!) on FIELD_DEFINITION
  directive @type(name: String!) on FIELD_DEFINITION
`;
export const schemaDirectives = gql`
  directive @join on OBJECT
  directive @unique on FIELD_DEFINITION
  directive @key(name: String!) on FIELD_DEFINITION
  directive @ref(name: String!) on FIELD_DEFINITION
  directive @field(name: String!, key: String!) on FIELD_DEFINITION
  directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION
`;
const directiveSchema = buildSchema(schemaDirectives);
const cacheDirectives = new WeakMap<ObjectTypeDefinitionNode | FieldDefinitionNode, Directives>();

export const getDirectives = <T extends ObjectTypeDefinitionNode | FieldDefinitionNode>(
  node: T,
): T extends ObjectTypeDefinitionNode ? TypeDirectives : FieldDirectives => {
  const directives = cacheDirectives.get(node);

  if (directives) {
    return directives;
  }

  const _directives = getDefDirectives(directiveSchema, node);
  cacheDirectives.set(node, _directives);
  return _directives;
};
