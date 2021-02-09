import {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLDirective,
  GraphQLError,
  GraphQLField,
  GraphQLSchema,
  isObjectType,
  Kind,
  OperationDefinitionNode,
} from "graphql";
import { getArgumentValues } from "graphql/execution/values";
import { getVariableValues } from "./values";

type Directives = { [name: string]: GraphQLDirective };
type DirectiveValues = Map<GraphQLField<any, any, { [key: string]: any }>, { [name: string]: { [key: string]: any } }>;

export type Context = {
  schema: GraphQLSchema;
  directives: Directives;
  directiveValues: DirectiveValues;
  fragments: { [name: string]: FragmentDefinitionNode };
  operation: OperationDefinitionNode;
  variables: { [key: string]: any };
};

const cache = new Map<GraphQLSchema, [Directives, DirectiveValues]>();

export const createContext = (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables: { [variable: string]: any },
  operationName?: string,
): Context => {
  let operation: OperationDefinitionNode | undefined;
  const fragments: { [fragment: string]: FragmentDefinitionNode } = Object.create(null);

  for (const definition of document.definitions) {
    switch (definition.kind) {
      case Kind.OPERATION_DEFINITION:
        if (operationName == null) {
          if (operation !== undefined) {
            throw new GraphQLError("Must provide operation name if query contains multiple operations.");
          }

          operation = definition;
        } else if (definition.name?.value === operationName) {
          operation = definition;
        }

        break;
      case Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition;
        break;
    }
  }

  if (!operation) {
    if (operationName != null) {
      throw new GraphQLError(`Unknown operation named "${operationName}".`);
    }

    throw new GraphQLError("Must provide an operation.");
  }

  const variableDefinitions = operation.variableDefinitions ?? [];
  const variableValues = getVariableValues(schema, variableDefinitions, variables);

  let result = cache.get(schema);

  if (!result) {
    const directives: Directives = Object.create(null);
    const directiveValues: DirectiveValues = new Map<any, any>();

    for (const directive of schema.getDirectives()) {
      directives[directive.name] = directive;
    }

    for (const type of Object.values(schema.getTypeMap())) {
      if (type.name.startsWith("__") || !isObjectType(type)) {
        continue;
      }

      for (const field of Object.values(type.getFields())) {
        const directiveValue: { [name: string]: { [key: string]: any } } = Object.create(null);

        for (const directive of field.astNode!.directives || []) {
          const name = directive.name.value;
          directiveValue[name] = getArgumentValues(directives[name], directive);
        }

        directiveValues.set(field, directiveValue);
      }
    }

    result = [directives, directiveValues];
    cache.set(schema, result);
  }

  return {
    schema,
    directives: result[0],
    directiveValues: result[1],
    fragments,
    operation,
    variables: variableValues,
  };
};
