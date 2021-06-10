import { format, resolveConfig } from "@mo36924/prettier";
import {
  getNamedType,
  getNullableType,
  GraphQLInputField,
  GraphQLSchema,
  isInputObjectType,
  isListType,
  isNonNullType,
  isScalarType,
} from "graphql";

const getFieldType = (field: GraphQLInputField) => {
  const { type, name } = field;
  const isNonNull = isNonNullType(type);
  const nullableType = getNullableType(type);
  const isList = isListType(nullableType);
  const namedType = getNamedType(nullableType);
  const isScalar = isScalarType(namedType);
  const fieldType = namedType.name;
  const typescriptType = isScalar ? getScalarType(fieldType) : fieldType;
  return `${name}${isNonNull ? "" : "?"}:${typescriptType}${isList ? "[]" : ""}${isNonNull ? "" : "|null"}\n`;
};

const getScalarType = (name: string) => {
  switch (name) {
    case "ID":
    case "UUID":
    case "String":
      return "string";
    case "Int":
    case "Float":
      return "number";
    case "Boolean":
      return "boolean";
    case "Date":
      return "Date";
    default:
      throw new Error(`Invalid scalar type: ${name}.`);
  }
};

export const buildDeclaration = (schema: GraphQLSchema, filepath = "index.d.ts") => {
  const types = schema.getTypeMap();
  let declaration = "export type {}\ndeclare global {\ndeclare namespace GraphQL {\n";

  for (const type of Object.values(types)) {
    const name = type.name;

    if (isInputObjectType(type)) {
      declaration += `export type ${name} = {\n`;

      for (const field of Object.values(type.getFields())) {
        declaration += getFieldType(field);
      }

      declaration += "}\n";
    }
  }

  declaration += "}}";
  declaration = format(declaration, { ...resolveConfig.sync(filepath), filepath });
  return declaration;
};
