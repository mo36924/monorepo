import { readFileSync } from "fs";
import type { default as babel, PluginObj } from "@babel/core";
import { buildSchema } from "@mo36924/graphql-schema";
import { DocumentNode, GraphQLSchema, parse, stripIgnoredCharacters, validate } from "graphql";

export type Options = {
  schema: string | GraphQLSchema;
};

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  let schema: GraphQLSchema;

  if (typeof options.schema === "string") {
    const graphql = readFileSync(options.schema || "index.graphql", "utf8");
    schema = buildSchema(graphql);
  } else if (options.schema) {
    schema = options.schema;
  }

  return {
    visitor: {
      TaggedTemplateExpression(path) {
        const {
          tag,
          quasi: { quasis, expressions },
        } = path.node;

        if (!t.isIdentifier(tag)) {
          return;
        }

        const name = tag.name;

        if (
          name !== "gql" &&
          name !== "query" &&
          name !== "mutation" &&
          name !== "useQuery" &&
          name !== "useMutation"
        ) {
          return;
        }

        let query = quasis[0].value.cooked ?? quasis[0].value.raw;
        let variables = "";

        for (let i = 0; i < expressions.length; i++) {
          query += `$_${i}${quasis[i + 1].value.cooked ?? quasis[i + 1].value.raw}`;
          variables += `$_${i}:Unknown`;
        }

        if (name === "query" || name === "useQuery") {
          if (variables) {
            query = `query(${variables}){${query}}`;
          } else {
            query = `{${query}}`;
          }
        } else if (name === "mutation" || name === "useMutation") {
          if (variables) {
            query = `mutation(${variables}){${query}}`;
          } else {
            query = `mutation{${query}}`;
          }
        }

        let documentNode: DocumentNode;

        try {
          query = stripIgnoredCharacters(query);
          documentNode = parse(query);
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        let errors = validate(schema, documentNode);

        for (const error of errors) {
          const match = error.message.match(
            /^Variable ".*?" of type "Unknown" used in position expecting type "(.*?)"\.$/,
          );

          if (match) {
            query = query.replace("Unknown", match[1]);
          } else {
            throw path.buildCodeFrameError(error.message);
          }
        }

        try {
          documentNode = parse(query);
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        errors = validate(schema, documentNode);

        for (const error of errors) {
          throw path.buildCodeFrameError(error.message);
        }

        const properties = [t.objectProperty(t.identifier("query"), t.stringLiteral(query))];

        if (variables) {
          properties.push(
            t.objectProperty(
              t.identifier("variables"),
              t.objectExpression(
                expressions.map((expression, i) => t.objectProperty(t.identifier(`_${i}`), expression as any)),
              ),
            ),
          );
        }

        if (name === "gql") {
          path.replaceWith(t.objectExpression(properties));
        } else {
          path.replaceWith(t.callExpression(t.identifier(name), [t.objectExpression(properties)]));
        }
      },
    },
  };
};
