import { buildSchema, FieldDefinitionNode, getDirectiveValues, ObjectTypeDefinitionNode } from "graphql";

export type TypeDirectives = { join?: {} };
export type FieldDirectives = {
  field?: { name: string; key: string };
  type?: { name: string; keys: [string, string] };
  key?: { name: string };
  ref?: { name: string };
  unique?: {};
};
export const modelDirectives = `
directive @field(name: String!) on FIELD_DEFINITION
directive @type(name: String!) on FIELD_DEFINITION
`;
export const schemaDirectives = `
directive @join on OBJECT
directive @unique on FIELD_DEFINITION
directive @key(name: String!) on FIELD_DEFINITION
directive @ref(name: String!) on FIELD_DEFINITION
directive @field(name: String! key: String!) on FIELD_DEFINITION
directive @type(name: String! keys: [String!]!) on FIELD_DEFINITION
`;
const directiveSchema = buildSchema(schemaDirectives);

export const getDirectives = <T extends ObjectTypeDefinitionNode | FieldDefinitionNode>(
  node: T,
): T extends ObjectTypeDefinitionNode ? TypeDirectives : FieldDirectives => {
  const directives = node.directives ?? [];
  const directiveValues: any = {};

  for (const directiveNode of directives) {
    const directiveName = directiveNode.name.value;

    directiveValues[directiveName] = getDirectiveValues(directiveSchema.getDirective(directiveName)!, {
      directives,
    });
  }

  return directiveValues;
};
