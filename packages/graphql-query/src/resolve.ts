import type { FieldDirectives } from "@mo36924/graphql-schema";
import {
  FieldNode,
  GraphQLCompositeType,
  GraphQLIncludeDirective,
  GraphQLInterfaceType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLSkipDirective,
  Kind,
  SelectionNode,
  SelectionSetNode,
  getDirectiveValues,
  getNamedType,
  getNullableType,
  isInterfaceType,
  isListType,
  isObjectType,
  isScalarType,
  typeFromAST,
} from "graphql";
import type { ExecutionContext } from "graphql/execution/execute";
import { getArgumentValues } from "graphql/execution/values";
import { getDirectives } from "./directives";

export type Types = { [typeName: string]: Fields };
export type Fields = { [fieldName: string]: Field };
export type Directives = FieldDirectives;
export type Args = { [key: string]: any };
export type Field = {
  parentType: string;
  alias: string;
  name: string;
  args: Args;
  directives: Directives;
  nullable: boolean;
  list: boolean;
  type: "scalar" | "object" | "interface" | "union";
  returnType: string;
  types: Types;
};

export const resolve = (
  context: ExecutionContext,
  parentType: GraphQLCompositeType,
  selectionSet: SelectionSetNode,
  types: Types,
) => {
  for (const selection of selectionSet.selections) {
    if (!shouldIncludeNode(context.variableValues, selection)) {
      continue;
    }

    switch (selection.kind) {
      case Kind.FIELD:
        resolveField(context, parentType, selection, types);
        break;
      case Kind.INLINE_FRAGMENT:
        resolve(context, typeFromAST(context.schema, selection.typeCondition!) as any, selection.selectionSet, types);
        break;
      case Kind.FRAGMENT_SPREAD:
        resolve(context, parentType, context.fragments[selection.name.value].selectionSet, types);
        break;
    }
  }

  return types;
};

const resolveField = (
  context: ExecutionContext,
  parentType: GraphQLCompositeType,
  fieldNode: FieldNode,
  types: Types,
) => {
  const parentTypeName = parentType.name;
  const fields = (types[parentTypeName] ??= Object.create(null));
  const name = fieldNode.name.value;
  const alias = fieldNode.alias ? fieldNode.alias.value : name;
  const field = (parentType as GraphQLObjectType | GraphQLInterfaceType).getFields()[name];
  const directives = getDirectives(field.astNode!);

  // for (const directive of fieldNode.directives || []) {
  //   const name = directive.name.value;

  //   switch (name) {
  //     case "skip":
  //     case "include":
  //       continue;
  //   }

  //   directives[name] = getArgumentValues(context.schema.getDirective(name)!, directive, context.variableValues);
  // }

  if (name === "__typename") {
    fields[alias] = {
      parentType: parentTypeName,
      alias,
      name,
      args: {},
      directives,
      nullable: false,
      list: false,
      type: "scalar",
      returnType: "String",
      types: Object.create(null),
    };

    return;
  }

  const fieldType = field.type;
  const nullableType = getNullableType(fieldType);
  const list = isListType(nullableType);
  const type: GraphQLNamedType = list ? getNamedType(nullableType) : (nullableType as any);
  const scalar = isScalarType(type);

  fields[alias] = {
    parentType: parentTypeName,
    alias,
    name,
    args: getArgumentValues(field, fieldNode, context.variableValues),
    directives,
    nullable: fieldType === nullableType,
    list,
    type: scalar ? "scalar" : isObjectType(type) ? "object" : isInterfaceType(type) ? "interface" : "union",
    returnType: type.name,
    types: scalar ? Object.create(null) : resolve(context, type as any, fieldNode.selectionSet!, Object.create(null)),
  };
};

const shouldIncludeNode = (variables: { [variable: string]: any }, node: SelectionNode): boolean => {
  const skip = getDirectiveValues(GraphQLSkipDirective, node, variables);

  if (skip?.if === true) {
    return false;
  }

  const include = getDirectiveValues(GraphQLIncludeDirective, node, variables);

  if (include?.if === false) {
    return false;
  }

  return true;
};
