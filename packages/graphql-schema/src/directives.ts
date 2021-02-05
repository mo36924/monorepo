import { buildSchema, DirectiveNode, getDirectiveValues } from "graphql";
import { createObject } from "./utils";

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

export const getDirectives = (directives: readonly DirectiveNode[] | undefined = []): { [directive: string]: any } => {
  const _directives = createObject();

  for (const directiveNode of directives) {
    const directiveName = directiveNode.name.value;

    _directives[directiveName] = getDirectiveValues(directiveSchema.getDirective(directiveName)!, {
      directives: directives,
    });
  }

  return _directives;
};
