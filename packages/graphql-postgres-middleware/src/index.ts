import graphqlMiddleware, { Execute, Send } from "@mo36924/graphql-middleware";
import postgresQuery from "@mo36924/graphql-postgres-query";
import type { GraphQLSchema } from "graphql";
import { Pool, PoolConfig } from "pg";

type Options = { schema: GraphQLSchema; main: PoolConfig; replica?: PoolConfig };
type Context = { main: Pool; replica: Pool };

const execute: Execute<Context> = async (req, _res, context, schema, document, variables, operationName) => {
  const { data: queries, errors, operation } = postgresQuery(schema, document, variables, operationName);
  const data: { [key: string]: any } = Object.create(null);

  if (!queries) {
    return {
      errors,
    };
  }

  if (operation === "query") {
    const client = req.method === "GET" ? context.replica : context.main;

    await Promise.all(
      queries.map(async (query) => {
        const result = await client.query(query);

        for (const row of result.rows) {
          Object.assign(data, row);
        }
      }),
    );
  } else {
    const client = await context.main.connect();

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

  return {
    data: `{"data":{${Object.entries(data)
      .map((entry) => `"${entry[0]}":${entry[1]}`)
      .join()}}}`,
  };
};

const send: Send = async (_req, res, _context, result) => {
  const json = result.data ?? JSON.stringify(result);
  const chunk = Buffer.from(json, "utf8");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", chunk.length.toString());
  res.end(chunk);
};

export default async (options: Options) => {
  const schema = options.schema;
  const main = new Pool(options.main);
  const replica = new Pool(options.replica ?? options.main);
  const context = { main, replica };
  const middleware = await graphqlMiddleware<Context>({ schema, context, execute, send });
  return middleware;
};
