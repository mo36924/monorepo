import { FieldDirectives, getDirectives } from "@mo36924/graphql-schema";
import {
  getNamedType,
  getNullableType,
  GraphQLField,
  GraphQLObjectType,
  isListType,
  isNullableType,
  isScalarType,
} from "graphql";

type Field = {
  type: GraphQLObjectType;
  scalar: boolean;
  nullable: boolean;
  list: boolean;
  directives: FieldDirectives;
};

const cacheField = new WeakMap<GraphQLField<any, any>, Field>();

export const getField = (field: GraphQLField<any, any>): Field => {
  let _field = cacheField.get(field);

  if (_field) {
    return _field;
  }

  const type = field.type;
  const nullableType = getNullableType(type);
  const namedType = getNamedType(nullableType);

  _field = {
    type: namedType as any,
    scalar: isScalarType(namedType),
    nullable: isNullableType(type),
    list: isListType(nullableType),
    directives: getDirectives(field.astNode!),
  };

  cacheField.set(field, _field);
  return _field;
};
