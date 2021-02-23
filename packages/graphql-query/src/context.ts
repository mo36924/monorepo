import { buildSchemaTypes, Types } from "@mo36924/graphql-schema";
import {
  DocumentNode,
  FragmentDefinitionNode,
  GraphQLError,
  GraphQLSchema,
  Kind,
  OperationDefinitionNode,
} from "graphql";
import { getVariableValues } from "./values";

export type Context = {
  schema: GraphQLSchema;
  types: Types;
  fragments: { [name: string]: FragmentDefinitionNode };
  operation: OperationDefinitionNode;
  variables: { [key: string]: any };
};

export const createContext = (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [variable: string]: any } | null,
  operationName?: string | null,
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

  const variableValues = getVariableValues(schema, operation.variableDefinitions!, variables ?? {});
  const types = buildSchemaTypes(schema);

  return {
    schema,
    types,
    fragments,
    operation,
    variables: variableValues,
  };
};
