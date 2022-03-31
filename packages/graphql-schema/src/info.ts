import {
  FieldNode,
  GraphQLField,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  getNamedType,
  getNullableType,
  isListType,
  isNullableType,
  isScalarType,
} from "graphql";
import { getFieldDef } from "graphql/execution/execute";
import { getArgumentValues } from "graphql/execution/values";
import type { Maybe } from "graphql/jsutils/Maybe";
import { FieldDirectives, getDirectives } from "./directives";
import type { FieldArguments } from "./schema";

export type FieldDefInfo = ({ type: GraphQLObjectType; scalar: false } | { type: GraphQLScalarType; scalar: true }) & {
  name: string;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
  schema: GraphQLSchema;
  parentType: GraphQLObjectType;
};

const cacheFieldDefInfo = new WeakMap<GraphQLField<any, any>, FieldDefInfo>();

export const getFieldDefInfo = (
  schema: GraphQLSchema,
  parentType: GraphQLObjectType,
  fieldName: string,
): FieldDefInfo => {
  const fieldDef = parentType.getFields()[fieldName];
  const fieldDefInfo = cacheFieldDefInfo.get(fieldDef);

  if (fieldDefInfo) {
    return fieldDefInfo;
  }

  const fieldType = fieldDef.type;
  const nullableType = getNullableType(fieldType);
  const namedType = getNamedType(nullableType);

  const _fieldDefInfo = {
    name: fieldDef.name,
    type: namedType as any,
    scalar: isScalarType(namedType),
    nullable: isNullableType(fieldType),
    list: isListType(nullableType),
    directives: getDirectives(fieldDef.astNode!),
    schema,
    parentType,
  };

  cacheFieldDefInfo.set(fieldDef, _fieldDefInfo);
  return _fieldDefInfo;
};

export type FieldInfo = FieldDefInfo & { alias: string | undefined; args: FieldArguments };

export const getFieldInfo = (
  schema: GraphQLSchema,
  parentType: GraphQLObjectType,
  fieldNode: FieldNode,
  variableValues?: Maybe<{ [key: string]: any }>,
): FieldInfo => ({
  ...getFieldDefInfo(schema, parentType, fieldNode.name.value),
  alias: fieldNode.alias?.value,
  args: getArgumentValues(getFieldDef(schema, parentType, fieldNode)!, fieldNode, variableValues),
});
