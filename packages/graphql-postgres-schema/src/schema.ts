import { createObject, getTypes } from "@mo36924/graphql-schema";
import { escapeIdentifier } from "@mo36924/postgres-escape";

const dbTypes = createObject<{ [key: string]: string }>({
  UUID: "uuid",
  ID: "uuid",
  Int: "integer",
  Float: "double precision",
  String: "text",
  Boolean: "boolean",
  Date: "timestamp(3)",
});

export const schema = (schema: string) => {
  const { Query, Mutation, ...types } = getTypes(schema);

  const extension: string[] = [`create extension if not exists pgcrypto;\n`];
  const create: string[] = [];
  const unique: string[] = [];
  const index: string[] = [];
  const key: string[] = [];

  for (const [typeName, type] of Object.entries(types)) {
    const { fields } = type;
    const columns: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        type: fieldTypeName,
        list,
        nullable,
        scalar,
        directives: { ref: refDirective, unique: uniqueDirective },
      } = field;

      if (scalar) {
        const dbType = dbTypes[fieldTypeName];

        switch (fieldName) {
          case "id":
            columns.push(`${escapeIdentifier(fieldName)} ${dbType} not null primary key`);
            break;
          default:
            columns.push(`${escapeIdentifier(fieldName)} ${dbType}${nullable ? "" : " not null"}`);
            break;
        }
      }

      if (uniqueDirective) {
        unique.push(`alter table ${escapeIdentifier(typeName)} add unique (${escapeIdentifier(fieldName)});\n`);
      } else if (refDirective) {
        index.push(`create index on ${escapeIdentifier(typeName)} (${escapeIdentifier(fieldName)});\n`);
      }

      if (refDirective) {
        key.push(
          `alter table ${escapeIdentifier(typeName)} add foreign key (${escapeIdentifier(
            fieldName,
          )}) references ${escapeIdentifier(refDirective.name)} (${escapeIdentifier("id")});\n`,
        );
      }
    }

    create.push(
      `create table ${escapeIdentifier(typeName)} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);\n`,
    );
  }

  return [extension, create, unique, index, key].flat().join("");
};
