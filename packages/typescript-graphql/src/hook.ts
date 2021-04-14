import type { Checker } from "@mo36924/typescript-patch";
import type { DocumentNode, GraphQLSchema } from "graphql";
import type { TaggedTemplateExpression } from "typescript";
import { getArgs } from "./args";
import { parse } from "./parse";
import { query } from "./query";
import { source } from "./source";
import { isGraphqlTag } from "./tag";
import type { typescript } from "./typescript";
import { validate } from "./validate";

export const hook = (ts: typescript, schema: GraphQLSchema, node: TaggedTemplateExpression, checker: Checker) => {
  if (!ts.isIdentifier(node.tag) || !isGraphqlTag(node.tag.text)) {
    return;
  }

  const _query = query(ts, schema, node).query;
  let documentNode: DocumentNode;

  try {
    documentNode = parse(source(_query));
  } catch {
    return;
  }

  const errors = validate(schema, documentNode);

  if (errors.length) {
    return;
  }

  const args = getArgs(ts, schema, node, checker, documentNode);
  return args;
};
