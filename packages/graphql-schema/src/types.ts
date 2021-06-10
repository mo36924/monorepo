import { createObject, createObjectNull } from "@mo36924/util";
import { DocumentNode, parse, Source } from "graphql";
import { FieldDirectives, getDirectives, TypeDirectives } from "./directives";
import { format } from "./format";
import { isScalarTypeName } from "./scalars";

export type Types = { [typeName: string]: Type };
export type Type = { name: string; directives: TypeDirectives; fields: Fields };
export type Fields = { [fieldName: string]: Field };
export type Field = {
  name: string;
  type: string;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};

export const buildTypes = (graphql: string | Source) => {
  const documentNode = parse(graphql);
  const types = buildAstTypes(documentNode);
  return types;
};

export const buildAstTypes = (documentNode: DocumentNode) => {
  const types = createObjectNull<Types>();

  for (const definition of documentNode.definitions) {
    if (definition.kind !== "ObjectTypeDefinition") {
      continue;
    }

    const fields = createObjectNull<Fields>();

    types[definition.name.value] = createObject({
      name: definition.name.value,
      fields: fields,
      directives: createObjectNull<TypeDirectives>(),
    });

    for (const fieldDefNode of definition.fields ?? []) {
      const name = fieldDefNode.name;
      let type = fieldDefNode.type;

      const field: Field = (fields[name.value] = createObject({
        name: name.value,
        type: "",
        scalar: false,
        nullable: true,
        list: false,
        directives: getDirectives(fieldDefNode),
      }));

      if (type.kind === "NonNullType") {
        type = type.type;
        field.nullable = false;
      }

      if (type.kind === "ListType") {
        type = type.type;
        field.nullable = false;
        field.list = true;
      }

      while (type.kind !== "NamedType") {
        type = type.type;
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

export const sortTypes = (types: Types) => {
  const _types = createObjectNull<Types>();

  for (const typeName of Object.keys(types).sort()) {
    const fields = types[typeName].fields;
    const _fields = createObjectNull<Fields>();

    for (const fieldName of Object.keys(fields).sort()) {
      _fields[fieldName] = fields[fieldName];
    }

    _types[typeName] = createObject<[Type, Pick<Type, "fields">]>(types[typeName], { fields: _fields });
  }

  return _types;
};

export const printTypes = (types: Types) => {
  let graphql = "";

  for (const { name, directives, fields } of Object.values(types)) {
    graphql += `type ${name}${printDirectives(directives)}{`;

    for (const field of Object.values(fields)) {
      graphql += `${field.name}:${printFieldType(field)}${printDirectives(field.directives)} `;
    }

    graphql += "}";
  }

  graphql = format(graphql);
  return graphql;
};

export const printFieldType = ({ type, list, nullable }: Pick<Field, "type" | "list" | "nullable">) => {
  return `${list ? `[${type}!]` : type}${nullable ? "" : "!"}`;
};

export const printDirectives = (directives: TypeDirectives | FieldDirectives) => {
  let _directives = "";

  for (const [name, args] of Object.entries(directives)) {
    if (args == null) {
      continue;
    }

    const entries = Object.entries(args);

    if (entries.length === 0) {
      _directives += `@${name}`;
      continue;
    }

    _directives += `@${name}(`;

    for (const [name, value] of entries) {
      _directives += `${name}:${JSON.stringify(value)} `;
    }

    _directives += `)`;
  }

  return _directives;
};
