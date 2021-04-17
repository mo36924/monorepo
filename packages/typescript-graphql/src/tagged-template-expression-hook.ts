import type { TaggedTemplateExpressionHook } from "@mo36924/typescript-patch";
import { getArgs } from "./args";
import { isGraphqlTag } from "./is-graphql-tag";
import { parse } from "./parse";
import { query } from "./query";
import { source } from "./source";
import type { TypescriptWithGraphQLSchema } from "./type";
import { validate } from "./validate";

export const taggedTemplateExpressionHook: TaggedTemplateExpressionHook = (
  ts: TypescriptWithGraphQLSchema,
  node,
  checker,
) => {
  if (!(ts.graphqlSchema && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.text))) {
    return;
  }

  const schema = ts.graphqlSchema;
  const documentNode = parse(source(query(ts, schema, node).query));

  if (documentNode instanceof Error) {
    return;
  }

  const errors = validate(schema, documentNode);

  if (errors.length) {
    return;
  }

  const args = getArgs(ts, schema, node, checker, documentNode);
  return args;
};
