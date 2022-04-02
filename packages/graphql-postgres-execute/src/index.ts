import { parse } from "@mo36924/graphql-json";
import { execute as _execute } from "@mo36924/graphql-postgres-sql";
import { replica, transaction } from "@mo36924/postgres";
import { ExecutionArgs, GraphQLError } from "graphql";

export type ExecutionResult =
  | { data?: undefined; errors: readonly GraphQLError[] }
  | { data: { [key: string]: any }; errors?: undefined };

export const execute = async (args: ExecutionArgs): Promise<ExecutionResult> => {
  const result = await executeJSON(args);

  if (result.errors) {
    return result;
  }

  return { data: parse(result.json) };
};

export type ExecutionJSONResult =
  | { json?: undefined; errors: readonly GraphQLError[] }
  | { json: string; errors?: undefined };

export const executeJSON = async (args: ExecutionArgs): Promise<ExecutionJSONResult> => {
  const result = _execute(args);

  if (result.errors) {
    return result;
  }

  if (result.query) {
    const [sql, values] = result.query;
    const _result = await replica(sql, values);
    return { json: _result.rows[0].data as string };
  }

  try {
    return await transaction(async (primary) => {
      const data: { [key: string]: string } = Object.create(null);

      for (const [sql, values] of result.mutation) {
        const { command, rows, rowCount } = await primary(sql, values);

        if (command === "SELECT") {
          Object.assign(data, rows[0]);
        } else if (rowCount !== 1) {
          throw new GraphQLError("Mutation failed.", {});
        }
      }

      const fields = Object.entries(data)
        .map(([key, value]) => `${JSON.stringify(key)}:${value}`)
        .join();

      return { json: `{${fields}}` };
    });
  } catch (error) {
    return { errors: [error as GraphQLError] };
  }
};
