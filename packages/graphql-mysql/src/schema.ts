import { getFieldDefInfo, ScalarUnionTypeNames } from "@mo36924/graphql-schema";
import { createObject } from "@mo36924/util";
import { GraphQLSchema, isObjectType } from "graphql";
import { escapeId } from "./util";

const dbTypes: { [key: string]: string } = createObject<[{ [key in ScalarUnionTypeNames]: string }]>({
  UUID: "binary(16)",
  ID: "binary(16)",
  Int: "integer",
  Float: "double precision",
  String: "longtext",
  Boolean: "boolean",
  Date: "datetime(3)",
});

export const createSchemaQuery = (schema: GraphQLSchema) => {
  const create: string[] = [];
  const unique: string[] = [];
  const index: string[] = [];
  const key: string[] = [];
  const excludeObjectTypes = [schema.getQueryType(), schema.getMutationType(), schema.getSubscriptionType()];

  for (const [typeName, type] of Object.entries(schema.getTypeMap())) {
    if (!isObjectType(type) || excludeObjectTypes.includes(type) || type.name.startsWith("__")) {
      continue;
    }

    const columns: string[] = [];

    for (const fieldName of Object.keys(type.getFields())) {
      const info = getFieldDefInfo(schema, type, fieldName);

      if (info.scalar) {
        const dbType = dbTypes[info.type.name];

        switch (fieldName) {
          case "id":
            columns.push(`${escapeId(fieldName)} ${dbType} not null primary key`);
            break;
          default:
            columns.push(`${escapeId(fieldName)} ${dbType}${info.nullable ? "" : " not null"}`);
            break;
        }
      }

      if (info.directives.unique) {
        unique.push(`alter table ${escapeId(typeName)} add unique (${escapeId(fieldName)});\n`);
      }

      if (info.directives.ref) {
        key.push(
          `alter table ${escapeId(typeName)} add foreign key (${escapeId(fieldName)}) references ${escapeId(
            info.directives.ref.name,
          )} (${escapeId("id")});\n`,
        );
      }
    }

    create.push(`create table ${escapeId(typeName)} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);\n`);
  }

  return [create, unique, index, key].flat().join("");
};
