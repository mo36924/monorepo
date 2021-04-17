import type { GraphQLSchema } from "graphql";
import type typescript from "typescript";
import type { TaggedTemplateExpression } from "typescript/lib/tsserverlibrary";
import { encode } from "./base52";
import { minify } from "./minify";
import { parse } from "./parse";
import { source } from "./source";
import { validate } from "./validate";

export const query = (ts: typeof typescript, schema: GraphQLSchema, node: TaggedTemplateExpression) => {
  const template = node.template;
  let query = "";
  let args = "";

  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    // 2 ``
    const templateWidth = template.getWidth() - 2;
    query = template.text.padStart(templateWidth);
  } else {
    const head = template.head;
    const templateSpans = template.templateSpans;

    // 3 `...${
    const templateWidth = head.getWidth() - 3;
    query = head.text.padStart(templateWidth);

    for (let i = 0, len = templateSpans.length; i < len; i++) {
      const templateSpan = templateSpans[i];
      const templateSpanWidth = templateSpan.getFullWidth();
      const literal = templateSpan.literal;
      const literalWidth = literal.getWidth();
      const expressionWidth = templateSpanWidth - literalWidth;
      const variableName = `$${encode(i)}`;
      const variable = variableName.padStart(expressionWidth + 2).padEnd(expressionWidth + 3);
      const templateWidth = literalWidth - (ts.isTemplateTail(literal) ? 2 : 3);
      const template = literal.text.padStart(templateWidth);
      query += variable + template;
      args += variableName + ":Unknown";
    }
  }

  const tagName = node.tag.getText();
  let offset = template.getStart() + 1;
  query = query.replace(/\n|\r/g, " ");

  if (tagName === "useQuery") {
    if (args.length) {
      query = `query(${args}){${query}}`;
      offset -= args.length + 8;
    } else {
      query = `{${query}}`;
      offset -= 1;
    }
  } else if (tagName === "useMutation") {
    if (args.length) {
      query = `mutation(${args}){${query}}`;
      offset -= args.length + 11;
    } else {
      query = `mutation{${query}}`;
      offset -= 9;
    }
  }

  if (tagName === "useQuery" || tagName === "useMutation") {
    const documentNode = parse(minify(source(query)));

    if (!(documentNode instanceof Error)) {
      const errors = validate(schema, documentNode);

      for (const error of errors) {
        const match = error.message.match(
          /^Variable ".*?" of type "Unknown" used in position expecting type "(.*?)"\.$/,
        );

        if (match) {
          query = query.replace("Unknown", match[1]);
          offset += 7 - match[1].length;
        }
      }
    }
  }

  return {
    query,
    offset,
  };
};
