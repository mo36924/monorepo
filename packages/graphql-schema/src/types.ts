import { DefinitionNode, DocumentNode, GraphQLSchema, isInterfaceType, isObjectType, parse } from "graphql";
import { getDirectives } from "./directives";
import { createObject, isScalarTypeName } from "./utils";

export type Types = { [typeName: string]: Type };
export type Type = { name: string; fields: Fields; directives: TypeDirectives };
export type TypeDirectives = { join?: {} };
export type Fields = { [fieldName: string]: Field };
export type Field = {
  name: string;
  type: string;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};
export type FieldDirectives = {
  field?: { name: string; key: string };
  type?: { name: string; keys: [string, string] };
  key?: { name: string };
  ref?: { name: string };
  unique?: {};
};

export const buildSchemaTypes = (schema: GraphQLSchema): Types => {
  if ((schema as any).__types) {
    return (schema as any).__types;
  }

  const typeMap = schema.getTypeMap();
  const definitions: DefinitionNode[] = [];

  const documentNode: DocumentNode = {
    kind: "Document",
    definitions,
  };

  for (const type of Object.values(typeMap)) {
    if ((isObjectType(type) || isInterfaceType(type)) && !type.name.startsWith("__")) {
      definitions.push(type.astNode!);
    }
  }

  return ((schema as any).__types = buildAstTypes(documentNode));
};

export const buildAstTypes = (documentNode: DocumentNode) => {
  const types: Types = Object.create(null);

  for (const def of documentNode.definitions) {
    if (def.kind !== "ObjectTypeDefinition" && def.kind !== "InterfaceTypeDefinition") {
      continue;
    }

    const fields: Fields = Object.create(null);

    types[def.name.value] = createObject({
      name: def.name.value,
      fields: fields,
      directives: Object.create(null),
    });

    for (const fieldDefNode of def.fields ?? []) {
      const name = fieldDefNode.name;
      const directives = fieldDefNode.directives;
      let type = fieldDefNode.type;

      const field: Field = (fields[name.value] = createObject({
        name: name.value,
        type: "",
        scalar: false,
        nullable: true,
        list: false,
        directives: getDirectives(directives),
      }));

      if (type.kind === "NonNullType") {
        type = type.type;
        field.nullable = false;
      }

      if (type.kind === "ListType") {
        type = type.type;
        field.nullable = false;
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

  return types;
};

export const getTypes = (source: string) => {
  const documentNode = parse(source);
  return buildAstTypes(documentNode);
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

export const printFieldType = ({ type, list, nullable }: Pick<Field, "type" | "list" | "nullable">) =>
  `${list ? `[${type}!]` : type}${nullable ? "" : "!"}`;

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
