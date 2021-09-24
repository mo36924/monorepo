import { parse as graphqlJSONParse } from "@mo36924/graphql-json";
import {
  DocumentNode,
  ExecutionArgs as _ExecutionArgs,
  GraphQLArgs as _GraphQLArgs,
  GraphQLError,
  parse,
  validate,
  validateSchema,
} from "graphql";
import { assertValidExecutionArguments } from "graphql/execution/execute";
import type { FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { buildContext } from "./context";
import { createMutationQueries } from "./mutation";
import { createQuery } from "./query";

export type Result = RowDataPacket[] | OkPacket | ResultSetHeader;
export type Query = <T = Result | Result[]>(
  sql: string,
) => Promise<[T, T extends Result ? FieldPacket[] : FieldPacket[][]]>;

export type DatabaseArgs = { primary: Query; replica?: Query };
export type ExecutionArgs = _ExecutionArgs & DatabaseArgs;
export type GraphQLArgs = _GraphQLArgs & DatabaseArgs;
export type ExecutionResultJSON =
  | {
      data: {};
      json: string;
      errors?: undefined;
    }
  | {
      data?: undefined;
      json?: undefined;
      errors: readonly GraphQLError[];
    };
export type ExecutionResult =
  | {
      data: { [key: string]: any };
      errors?: undefined;
    }
  | {
      data?: undefined;
      errors: readonly GraphQLError[];
    };

export const executeJSON = async (args: ExecutionArgs): Promise<ExecutionResultJSON> => {
  const { schema, document, variableValues, operationName, primary, replica = primary } = args;
  assertValidExecutionArguments(schema, document, variableValues);
  const context = buildContext(schema, document, variableValues, operationName);

  if (!("schema" in context)) {
    return { errors: context };
  }

  switch (context.operation.operation) {
    case "query": {
      const result = await replica<{ data: string }[]>(createQuery(context));
      return { data: {}, json: `{"data":${result[0][0].data}}` };
    }
    case "mutation": {
      const result = await primary<(ResultSetHeader | RowDataPacket[])[]>(createMutationQueries(context).join(""));
      const results: { [key: string]: string } = Object.create(null);

      for (const headerOrPackets of result[0]) {
        if (Array.isArray(headerOrPackets) && headerOrPackets[0]) {
          Object.assign(results, headerOrPackets[0]);
        }
      }

      const data = Object.entries(results)
        .map(([key, value]) => `${JSON.stringify(key)}:${value}`)
        .join();

      return { data: {}, json: `{"data":{${data}}}` };
    }
    default:
      return { errors: [new GraphQLError(`Unsupported ${context.operation.operation} operation.`)] };
  }
};

export const execute = async (args: ExecutionArgs): Promise<ExecutionResult> => {
  const result = await executeJSON(args);

  if (result.errors) {
    return result;
  }

  return graphqlJSONParse(result.json);
};

export const graphqlJSON = async (args: GraphQLArgs): Promise<ExecutionResultJSON> => {
  const { schema, source, variableValues, operationName, primary, replica = primary } = args;
  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length > 0) {
    return { errors: schemaValidationErrors };
  }

  let document: DocumentNode;

  try {
    document = parse(source);
  } catch (syntaxError: any) {
    return { errors: [syntaxError as GraphQLError] };
  }

  const validationErrors = validate(schema, document);

  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  const result = await executeJSON({ schema, document, variableValues, operationName, primary, replica });

  return result;
};

export const graphql = async (args: GraphQLArgs): Promise<ExecutionResult> => {
  const result = await graphqlJSON(args);

  if (result.errors) {
    return result;
  }

  return graphqlJSONParse(result.json);
};
