import {
  coerceInputValue,
  GraphQLError,
  GraphQLSchema,
  isInputType,
  isNonNullType,
  print,
  typeFromAST,
  valueFromAST,
  VariableDefinitionNode,
} from "graphql";
// @ts-ignore
import inspect from "graphql/jsutils/inspect";
// @ts-ignore
import printPathArray from "graphql/jsutils/printPathArray";

const hasOwnProperty = (obj: any, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop);

export const getVariableValues = (
  schema: GraphQLSchema,
  varDefNodes: ReadonlyArray<VariableDefinitionNode>,
  variables: { [variable: string]: any },
): { [variable: string]: any } => {
  const variableValues: { [variable: string]: any } = {};

  for (const varDefNode of varDefNodes) {
    const varName = varDefNode.variable.name.value;
    const varType = typeFromAST(schema, varDefNode.type as any);

    if (!isInputType(varType)) {
      const varTypeStr = print(varDefNode.type);
      throw new GraphQLError(
        `Variable "$${varName}" expected value of type "${varTypeStr}" which cannot be used as an input type.`,
        varDefNode.type,
      );
    }

    if (!hasOwnProperty(variables, varName)) {
      if (varDefNode.defaultValue) {
        variableValues[varName] = valueFromAST(varDefNode.defaultValue, varType);
      } else if (isNonNullType(varType)) {
        const varTypeStr = inspect(varType);
        throw new GraphQLError(`Variable "$${varName}" of required type "${varTypeStr}" was not provided.`, varDefNode);
      }

      continue;
    }

    const value = variables[varName];

    if (value === null && isNonNullType(varType)) {
      const varTypeStr = inspect(varType);
      throw new GraphQLError(`Variable "$${varName}" of non-null type "${varTypeStr}" must not be null.`, varDefNode);
    }

    variableValues[varName] = coerceInputValue(value, varType, (path, invalidValue, error) => {
      let prefix = `Variable "$${varName}" got invalid value ` + inspect(invalidValue);

      if (path.length > 0) {
        prefix += ` at "${varName}${printPathArray(path)}"`;
      }

      throw new GraphQLError(
        prefix + "; " + error.message,
        varDefNode,
        undefined,
        undefined,
        undefined,
        error.originalError,
      );
    });
  }

  return variableValues;
};
