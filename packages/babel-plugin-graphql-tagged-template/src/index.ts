import { readFileSync } from "fs";
import type { PluginObj, default as babel, types as t } from "@babel/core";
import { encode } from "@mo36924/base52";
import { buildSchema, buildSchemaModel } from "@mo36924/graphql-schema";
import {
  DocumentNode,
  GraphQLInputType,
  GraphQLSchema,
  TypeInfo,
  parse,
  stripIgnoredCharacters,
  validate,
  visit,
  visitWithTypeInfo,
} from "graphql";

export type Options = {
  model: string;
  schema: string | GraphQLSchema;
};

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  let schema: GraphQLSchema;

  if (options.model) {
    const model = readFileSync(options.model || "index.graphql", "utf8");
    schema = buildSchemaModel(model);
  } else if (typeof options.schema === "string") {
    const graphqlSchema = readFileSync(options.schema || "index.graphql", "utf8");
    schema = buildSchema(graphqlSchema);
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

        if (name !== "gql" && name !== "query" && name !== "mutation" && name !== "subscription") {
          return;
        }

        let query = quasis[0].value.cooked ?? quasis[0].value.raw;

        for (let i = 0; i < expressions.length; i++) {
          query += `$${encode(i)}${quasis[i + 1].value.cooked ?? quasis[i + 1].value.raw}`;
        }

        if (name === "mutation" || name === "subscription") {
          query = name + query;
        }

        let documentNode: DocumentNode;

        try {
          documentNode = parse(query);
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        const values: GraphQLInputType[] = [];
        const typeInfo = new TypeInfo(schema);

        visit(
          documentNode,
          visitWithTypeInfo(typeInfo, {
            Variable() {
              values.push(typeInfo.getInputType()!);
            },
          }),
        );

        if (values.length) {
          const variables = `(${values.map((value, i) => `$${encode(i)}:${value}`).join()})`;

          if (name === "query") {
            query = name + variables + query;
          } else if (name === "mutation" || name === "subscription") {
            query = name + variables + query.slice(name.length);
          }
        }

        try {
          documentNode = parse(query);
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        const errors = validate(schema, documentNode);

        if (errors.length) {
          throw path.buildCodeFrameError(errors[0].message);
        }

        const args: t.Expression[] = [t.stringLiteral(stripIgnoredCharacters(query))];

        if (expressions.length) {
          args.push(
            t.objectExpression(
              expressions.map((expression, i) => t.objectProperty(t.identifier(encode(i)), expression as any)),
            ),
          );
        }

        path.replaceWith(t.callExpression(t.identifier(name), args));
      },
    },
  };
};
