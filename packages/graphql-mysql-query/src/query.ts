import { escape, escapeId } from "@mo36924/mysql-escape";
import {
  DocumentNode,
  GraphQLSchema,
  TypeInfo,
  visit,
  visitWithTypeInfo,
  isScalarType,
  getNamedType,
  isNonNullType,
  getNullableType,
  isListType,
} from "graphql";

export const query = (schema: GraphQLSchema, document: DocumentNode) => {
  const typeInfo = new TypeInfo(schema);
  let sql = "";

  visit(
    document,
    visitWithTypeInfo(typeInfo, {
      OperationDefinition: {
        enter() {
          sql += "select json_object(";
        },
        leave() {
          sql += ") as data;";
        },
      },
      Field: {
        enter(node, key, parent, path, ancestors) {
          const type = typeInfo.getType()!;
          const isNonNull = isNonNullType(type);
          const nullableType = getNullableType(type);
          const isList = isListType(nullableType);
          const namedType = getNamedType(nullableType);
          const isScalar = isScalarType(namedType);
          const fieldType = namedType.name;

          if (key) {
            sql += ",";
          }

          sql += `${escape((node.alias ?? node.name).value)},`;

          if (isScalar) {
            sql += escapeId(node.name.value);
            return false;
          }

          if (isList) {
            sql += "(select concat('[',group_concat(json_object(";
          } else {
            sql += "(select json_object(";
          }
        },
        leave() {
          const type = typeInfo.getType()!;
          const isNonNull = isNonNullType(type);
          const nullableType = getNullableType(type);
          const isList = isListType(nullableType);
          const namedType = getNamedType(nullableType);

          if (isList) {
            sql += ")),']'";
          }

          sql += `) from ${escapeId(namedType.name)})`;
        },
      },
    }),
  );

  return sql;
};
