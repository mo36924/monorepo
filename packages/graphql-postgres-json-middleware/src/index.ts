import graphqlMiddleware, { Options as graphqlMiddlewareOptions } from "@mo36924/graphql-middleware";
import postgresQuery from "@mo36924/graphql-postgres-json-query";
import type { MiddlewareFactory } from "@mo36924/http-server";
import { getOperationAST } from "graphql";
import pg, { PoolConfig } from "pg";

export type Options = Omit<graphqlMiddlewareOptions, "execute"> & { main: PoolConfig; replica?: PoolConfig };

export default (options: Options): MiddlewareFactory => async (server) => {
  const main = new pg.Pool(options.main);
  const replica = new pg.Pool(options.replica ?? options.main);

  const middleware = await graphqlMiddleware({
    ...options,
    async execute(req, _res, schema, document, variables, operationName) {
      const result = postgresQuery(schema, document, variables, operationName);

      if (result.errors) {
        return result;
      }

      const data: { [key: string]: any } = Object.create(null);
      const queries = result.data;
      const operation = getOperationAST(document, operationName)!.operation;

      if (operation === "query") {
        const client = req.method === "GET" ? replica : main;

        await Promise.all(
          queries.map(async (query) => {
            const result = await client.query(query);

            for (const row of result.rows) {
              Object.assign(data, row);
            }
          }),
        );
      } else {
        const client = await main.connect();

        try {
          await client.query("begin");

          for (const query of queries) {
            const result = await client.query(query);

            if (result.command === "SELECT") {
              for (const row of result.rows) {
                Object.assign(data, row);
              }
            } else if (result.rowCount !== 1) {
              throw new Error("Optimistic locking failed.");
            }
          }

          await client.query("commit");
        } catch (e) {
          await client.query("rollback");
          throw e;
        } finally {
          client.release();
        }
      }

      return { raw: JSON.stringify({ data }) };
    },
  })(server);

  return middleware;
};
