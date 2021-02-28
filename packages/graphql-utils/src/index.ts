import type { FieldDirectives } from "@mo36924/graphql-schema";
import {
  FieldDefinitionNode,
  getDirectiveValues,
  getNamedType,
  getNullableType,
  GraphQLField,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  isListType,
  isScalarType,
} from "graphql";

const cacheDirectives = new WeakMap<FieldDefinitionNode, FieldDirectives>();

export const infoDirectives = (info: GraphQLResolveInfo): FieldDirectives => {
  return fieldDirectives(info.schema, info.parentType.getFields()[info.fieldName]);
};

export const fieldDirectives = (schema: GraphQLSchema, field: GraphQLField<any, any>): FieldDirectives => {
  const fieldDef = field.astNode!;
  const directives = cacheDirectives.get(fieldDef);

  if (directives) {
    return directives;
  }

  const _directives = Object.create(null);

  for (const directive of fieldDef.directives ?? []) {
    _directives[directive.name.value] = getDirectiveValues(schema.getDirective(directive.name.value)!, fieldDef);
  }

  cacheDirectives.set(fieldDef, _directives);
  return _directives;
};

type FieldInfo = {
  type: GraphQLObjectType;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};

const cacheFieldInfo = new WeakMap<GraphQLField<any, any>, FieldInfo>();

export const getFieldInfo = (schema: GraphQLSchema, field: GraphQLField<any, any>): FieldInfo => {
  const fieldInfo = cacheFieldInfo.get(field);

  if (fieldInfo) {
    return fieldInfo;
  }

  const returnType = field.type;
  const nullableType = getNullableType(returnType);
  const namedType = getNamedType(nullableType);

  const _fieldInfo = {
    type: namedType as any,
    scalar: isScalarType(namedType),
    nullable: returnType === nullableType,
    list: isListType(nullableType),
    directives: fieldDirectives(schema, field),
  };

  cacheFieldInfo.set(field, _fieldInfo);
  return _fieldInfo;
};
