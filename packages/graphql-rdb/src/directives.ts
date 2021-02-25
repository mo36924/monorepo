import type { FieldDirectives } from "@mo36924/graphql-schema";
import { FieldDefinitionNode, getDirectiveValues, GraphQLField, GraphQLResolveInfo, GraphQLSchema } from "graphql";

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
