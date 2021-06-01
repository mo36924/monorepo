import { readFileSync } from "fs";
import type { default as babel, PluginObj } from "@babel/core";
import {
  buildSchema,
  DocumentNode,
  GraphQLScalarType,
  GraphQLSchema,
  parse,
  stripIgnoredCharacters,
  validate,
} from "graphql";

export type Options = {
  schema: string | GraphQLSchema;
};

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  let schema: GraphQLSchema = buildSchema("scalar Unknown");

  if (typeof options.schema === "string") {
    try {
      const gql = readFileSync(options.schema || "schema.gql", "utf8");
      schema = buildSchema(`${gql}\nscalar Unknown`);
    } catch {}
  } else if (options.schema) {
    schema = options.schema;
  }

  if (!schema.getType("Unknown")) {
    schema.getTypeMap()["Unknown"] = new GraphQLScalarType({ name: "Unknown" });
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

        if (name !== "gql" && name !== "useQuery" && name !== "useMutation") {
          return;
        }

        let query = quasis[0].value.cooked ?? quasis[0].value.raw;
        let variables = "";

        for (let i = 0; i < expressions.length; i++) {
          query += `$_${i}${quasis[i + 1].value.cooked ?? quasis[i + 1].value.raw}`;
          variables += `$_${i}:Unknown`;
        }

        if (variables) {
          variables = `(${variables})`;
        }

        if (name === "useQuery") {
          query = `query${variables}{${query}}`;
        } else if (name === "useMutation") {
          query = `mutation${variables}{${query}}`;
        }

        query = stripIgnoredCharacters(query);
        let documentNode: DocumentNode;

        try {
          documentNode = parse(query);
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        let errors = validate(schema, documentNode);

        for (const error of errors) {
          const match = error.message.match(
            /^Variable "(.*?)" of type "Unknown" used in position expecting type "(.*?)"\.$/,
          );

          if (match) {
            query = query.replace(`${match[1]}:Unknown`, `${match[1]}:${match[2]}`);
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
