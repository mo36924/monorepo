import { parse as jsonParse } from "@mo36924/graphql-json";
import { DocumentNode, GraphQLError, GraphQLSchema, parse, validate, validateSchema } from "graphql";
import type { Connection, FieldPacket, Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { buildContext } from "./context";
import { createMutationQueries } from "./mutation";
import { createQuery } from "./query";

export type GraphQLMySQLArgs = {
  schema: GraphQLSchema;
  query: string;
  variables?: { [key: string]: any } | null | undefined;
  operationName?: string | null | undefined;
  source: Connection | Pool;
  replica?: Connection | Pool;
};

export const graphqlJSON = async (args: GraphQLMySQLArgs) => {
  const { schema, query, variables, operationName, source, replica = source } = args;
  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length > 0) {
    return { errors: schemaValidationErrors };
  }

  let document: DocumentNode;

  try {
    document = parse(query);
  } catch (syntaxError: any) {
    return { errors: [syntaxError as GraphQLError] };
  }

  const validationErrors = validate(schema, document);

  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  const context = buildContext(schema, document, variables, operationName);

  if (!("schema" in context)) {
    return { errors: context };
  }

  switch (context.operation.operation) {
    case "query": {
      const result = await replica.query<RowDataPacket[]>(createQuery(context));
      return `{"data":${result[0][0].data}}`;
    }
    case "mutation": {
      const result: [(ResultSetHeader | RowDataPacket[])[], FieldPacket[]] = await source.query<any>(
        createMutationQueries(context).join(""),
      );

      const results: { [key: string]: string } = Object.create(null);

      for (const headerOrPackets of result[0]) {
        if (Array.isArray(headerOrPackets) && headerOrPackets[0]) {
          Object.assign(results, headerOrPackets[0]);
        }
      }

      const raw = Object.entries(results)
        .map(([key, value]) => `${JSON.stringify(key)}:${value}`)
        .join();

      return `{"data":{${raw}}}`;
    }
    default:
      return { errors: [new GraphQLError(`Unsupported ${context.operation.operation} operation.`)] };
  }
};

export const graphql = async (
  args: GraphQLMySQLArgs,
): Promise<
  | {
      data?: undefined;
      errors: readonly GraphQLError[];
    }
  | {
      data: {
        [key: string]: any;
      };
      errors?: undefined;
    }
> => {
  const result = await graphqlJSON(args);
  return typeof result === "string" ? (jsonParse(result) as { data: { [key: string]: any } }) : result;
};
