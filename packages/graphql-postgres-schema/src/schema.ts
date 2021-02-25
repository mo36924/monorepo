import { createObject, getTypes } from "@mo36924/graphql-schema";
import { escapeId } from "@mo36924/postgres-escape";

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
            columns.push(`${escapeId(fieldName)} ${dbType} not null primary key`);
            break;
          default:
            columns.push(`${escapeId(fieldName)} ${dbType}${nullable ? "" : " not null"}`);
            break;
        }
      }

      if (uniqueDirective) {
        unique.push(`alter table ${escapeId(typeName)} add unique (${escapeId(fieldName)});\n`);
      } else if (refDirective) {
        index.push(`create index on ${escapeId(typeName)} (${escapeId(fieldName)});\n`);
      }

      if (refDirective) {
        key.push(
          `alter table ${escapeId(typeName)} add foreign key (${escapeId(fieldName)}) references ${escapeId(
            refDirective.name,
          )} (${escapeId("id")});\n`,
        );
      }
    }

    create.push(`create table ${escapeId(typeName)} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);\n`);
  }

  return [create, unique, index, key].flat().join("");
};
