import {
  FieldDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  parse,
  print,
  stripIgnoredCharacters,
} from "graphql";
import { getArgumentValues } from "graphql/execution/values";
import prettier from "prettier";

export type Directives = { [directiveName: string]: { [key: string]: any } };

export const getDefDirectives = (
  schema: GraphQLSchema,
  node: ObjectTypeDefinitionNode | FieldDefinitionNode,
): Directives => {
  const directives: Directives = Object.create(null);

  for (const directive of node.directives!) {
    directives[directive.name.value] = getArgumentValues(schema.getDirective(directive.name.value)!, directive);
  }

  return directives;
};

export const minify = (code: string) => {
  return stripIgnoredCharacters(code);
};

export const format = (code: string, filepath: string = "index.gql") => {
  code = minify(code);
  const documentNode = parse(code);
  code = print(documentNode);
  const prettierConfig = prettier.resolveConfig.sync(filepath);
  code = prettier.format(code, { ...prettierConfig, filepath });
  return code;
};

export const gql = (strings: TemplateStringsArray) => strings[0];
