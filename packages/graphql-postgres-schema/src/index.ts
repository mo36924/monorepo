import { config } from "@mo36924/graphql-config";
import { ScalarTypeName, buildModel, isSchemaTypeName } from "@mo36924/graphql-model";
import { escapeId } from "@mo36924/postgres-escape";

export default (model?: string) => {
  const types = model ? buildModel(model).types : config().types;
  const create: string[] = [];
  const unique: string[] = [];
  const index: string[] = [];

  const dbTypes: { [key in ScalarTypeName]: string } = Object.assign(Object.create(null) as {}, {
    UUID: "uuid",
    ID: "string",
    Int: "integer",
    Float: "double precision",
    String: "text",
    Boolean: "boolean",
    Date: "timestamp(3)",
    JSON: "jsonb",
  });

  for (const [typeName, type] of Object.entries(types)) {
    if (isSchemaTypeName(typeName)) {
      continue;
    }

    const { fields } = type;
    const columns: string[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        type: fieldTypeName,
        nullable,
        scalar,
        directives: { ref: refDirective, unique: uniqueDirective },
      } = field;

      if (scalar) {
        const dbType = dbTypes[fieldTypeName as ScalarTypeName];

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
    }

    create.push(`create table ${escapeId(typeName)} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);\n`);
  }

  return [create, unique, index].flat().join("");
};
