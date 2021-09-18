import type { FieldArguments, FieldDirectives } from "@mo36924/graphql-schema";
import {
  FieldDefinitionNode,
  FieldNode,
  getNamedType,
  getNullableType,
  GraphQLField,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  isListType,
  isNullableType,
  isScalarType,
} from "graphql";
import { getFieldDef } from "graphql/execution/execute";
import { getArgumentValues } from "graphql/execution/values";
import type { Maybe } from "graphql/jsutils/Maybe";

const cacheFieldDefDirectives = new WeakMap<FieldDefinitionNode, FieldDirectives>();

export const getFieldDefDirectives = (
  schema: GraphQLSchema,
  fieldDefinitionNode: FieldDefinitionNode,
): FieldDirectives => {
  const directives = cacheFieldDefDirectives.get(fieldDefinitionNode);

  if (directives) {
    return directives;
  }

  const _directives = Object.create(null);

  for (const directive of fieldDefinitionNode.directives!) {
    _directives[directive.name.value] = getArgumentValues(schema.getDirective(directive.name.value)!, directive);
  }

  cacheFieldDefDirectives.set(fieldDefinitionNode, _directives);
  return _directives;
};

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
  const fieldDef = getFieldDef(schema, parentType, fieldName)!;
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
    directives: getFieldDefDirectives(schema, fieldDef.astNode!),
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
  args: getArgumentValues(getFieldDef(schema, parentType, fieldNode.name.value)!, fieldNode, variableValues),
});
