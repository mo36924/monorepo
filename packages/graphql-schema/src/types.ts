import { parse } from "graphql";
import { getDirectives } from "./directives";
import { copyTypes, isScalarTypeName } from "./utils";

export type Types = { [typeName: string]: Type };
export type Type = { fields: Fields; directives: TypeDirectives };
export type TypeDirectives = { join?: {} };
export type Fields = { [fieldName: string]: Field };
export type Field = { type: string; scalar: boolean; null: boolean; list: boolean; directives: FieldDirectives };
export type FieldDirectives = {
  field?: { name: string; key: string };
  type?: { name: string; keys: [string, string] };
  key?: { name: string };
  ref?: { name: string };
  unique?: {};
};

export const getTypes = (source: string) => {
  const document = parse(source);
  const types: Types = Object.create(null);

  for (const def of document.definitions) {
    if (def.kind !== "ObjectTypeDefinition") {
      continue;
    }

    const { fields }: Type = (types[def.name.value] = { fields: Object.create(null), directives: {} });

    for (let { type, name, directives } of def.fields ?? []) {
      const field: Field = (fields[name.value] = {
        type: "",
        scalar: false,
        null: true,
        list: false,
        directives: getDirectives(directives),
      });

      if (type.kind === "NonNullType") {
        type = type.type;
        field.null = false;
      }

      if (type.kind === "ListType") {
        type = type.type;
        field.null = false;
        field.list = true;

        if (type.kind === "NonNullType") {
          type = type.type;
        }
      }

      if (type.kind !== "NamedType") {
        throw new Error();
      }

      field.type = type.name.value;

      if (isScalarTypeName(field.type)) {
        field.scalar = true;
        field.list = false;
      }
    }
  }

  return copyTypes(types);
};

export const printTypes = (types: Types) =>
  Object.entries(types)
    .map(
      ([typeName, { fields, directives }]) =>
        `type ${typeName}${printDirectives(directives)}{${Object.entries(fields)
          .map(([fieldName, field]) => `${fieldName}:${printFieldType(field)}${printDirectives(field.directives)}`)
          .join()}}`,
    )
    .join("");

export const printFieldType = ({ type, list, null: _null }: Pick<Field, "type" | "list" | "null">) =>
  `${list ? `[${type}!]` : type}${_null ? "" : "!"}`;

export const printDirectives = (directives: TypeDirectives | FieldDirectives) =>
  Object.entries(directives)
    .map(([name, directive]) => {
      if (!directive || typeof directive !== "object") {
        return;
      }

      if (Object.keys(directive).length === 0) {
        return `@${name}`;
      } else {
        return `@${name}(${JSON.stringify(directive)
          .replace(/"([^"]+)":/g, "$1:")
          .slice(1, -1)})`;
      }
    })
    .filter((v) => v)
    .join("");
