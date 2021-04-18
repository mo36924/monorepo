import type { GraphQLSchema } from "graphql";
import type { TaggedTemplateExpressionHook } from "typescript";
import { getArgs } from "./args";
import { isGraphqlTag } from "./is-graphql-tag";
import { parse } from "./parse";
import { query } from "./query";
import { source } from "./source";
import { validate } from "./validate";

export const factory = (schema: GraphQLSchema): TaggedTemplateExpressionHook => (ts, node, checker) => {
  if (!ts.isIdentifier(node.tag) || !isGraphqlTag(node.tag.text)) {
    return;
  }

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
