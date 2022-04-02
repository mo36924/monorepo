import { readFileSync } from "fs";
import babel, { PluginObj, types as t } from "@babel/core";
import { buildASTSchema } from "@mo36924/graphql-build";
import { config } from "@mo36924/graphql-config";
import { buildModel } from "@mo36924/graphql-model";
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
  parse?: boolean;
  model?: string | DocumentNode;
  schema?: string | GraphQLSchema;
};

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  let schema: GraphQLSchema;

  if (typeof options.schema === "string") {
    schema = buildASTSchema(parse(readFileSync(options.schema, "utf-8")));
  } else if (options.schema && typeof options.schema === "object") {
    schema = options.schema;
  } else if (typeof options.model === "string") {
    schema = buildModel(readFileSync(options.model, "utf-8")).schema;
  } else if (options.model && typeof options.model === "object") {
    schema = buildASTSchema(options.model);
  } else {
    schema = config().schema;
  }

  return {
    name: "graphql-tagged-template",
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
        let operation = "";

        switch (name) {
          case "gql":
          case "query":
          case "useQuery":
            break;
          case "mutation":
          case "useMutation":
            operation = "mutation";
            break;
          case "subscription":
          case "useSubscription":
            operation = "subscription";
            break;
          default:
            return;
        }

        let query = operation + (quasis[0].value.cooked ?? quasis[0].value.raw);

        for (let i = 0; i < expressions.length; i++) {
          query += `$_${i}${quasis[i + 1].value.cooked ?? quasis[i + 1].value.raw}`;
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
          const variables = `(${values.map((value, i) => `$_${i}:${value}`).join()})`;

          if (operation) {
            query = operation + variables + query.slice(operation.length);
          } else if (name !== "gql") {
            query = "query" + variables + query;
          }
        }

        try {
          documentNode = parse(query, { noLocation: true });
        } catch (err) {
          throw path.buildCodeFrameError(String(err));
        }

        const errors = validate(schema, documentNode);

        if (errors.length) {
          throw path.buildCodeFrameError(errors[0].message);
        }

        const properties: t.ObjectProperty[] = [];

        if (options.parse) {
          const id = path.scope.generateUid("gql");
          path.scope.getProgramParent().push({ kind: "let", id: t.identifier(id) });

          properties.push(
            t.objectProperty(
              t.identifier("document"),
              t.assignmentExpression(
                "||=",
                t.identifier(id),
                t.callExpression(t.memberExpression(t.identifier("JSON"), t.identifier("parse")), [
                  t.stringLiteral(JSON.stringify(documentNode)),
                ]),
              ),
            ),
          );
        } else {
          properties.push(t.objectProperty(t.identifier("query"), t.stringLiteral(stripIgnoredCharacters(query))));
        }

        if (expressions.length) {
          properties.push(
            t.objectProperty(
              t.identifier("variables"),
              t.objectExpression(
                expressions.map((expression, i) => t.objectProperty(t.identifier("_" + i), expression as t.Expression)),
              ),
            ),
          );
        }

        path.replaceWith(t.callExpression(t.identifier(name), [t.objectExpression(properties)]));
      },
    },
  };
};
