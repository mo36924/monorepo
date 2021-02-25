import type { IncomingMessage, ServerResponse } from "http";
import { promisify } from "util";
import { gzip as gzipCompress, brotliCompress, constants } from "zlib";
import accepts from "accepts";
import { graphqlHTTP } from "express-graphql";
import { execute, ExecutionArgs, ExecutionResult, getOperationAST, GraphQLSchema } from "graphql";
import type { PoolConfig } from "pg";
import type { Context } from "./context";
import fieldResolver from "./field-resolver";

type Options = { schema: GraphQLSchema; db: PostgresOptions };
type PostgresOptions = { name: "postgres"; main: PoolConfig; replica?: PoolConfig };

export default async (options: Options) => {
  const raw = Symbol();
  const brotli = promisify(brotliCompress);
  const gzip = promisify(gzipCompress);
  const schema = options.schema;
  const db = options.db;
  let middleware: ReturnType<typeof graphqlHTTP>;

  if (db.name === "postgres") {
    const [{ Pool }, { escape, escapeId }] = await Promise.all([import("pg"), import("@mo36924/postgres-escape")]);
    const main = new Pool(db.main);
    const replica = new Pool(db.replica ?? db.main);

    middleware = graphqlHTTP((req, res, params) => {
      return {
        schema,
        pretty: false,
        fieldResolver: fieldResolver as any,
        async customExecuteFn(args) {
          const operation = getOperation(args)!;
          let result: ExecutionResult & { [raw]?: Buffer };

          if (operation === "query") {
            const context: Context = {
              escape,
              escapeId,
              date: new Date(),
              ids: Object.create(null),
              db: async (query: string) => {
                const results = await replica.query(query);
                return results;
              },
            };

            result = await execute({ ...args, contextValue: context });
          } else {
            const client = await main.connect();

            try {
              await client.query("begin");

              const context: Context = {
                escape,
                escapeId,
                date: new Date(),
                ids: Object.create(null),
                db: async (query: string) => {
                  const results = await client.query(query);
                  return results;
                },
              };

              result = await execute({ ...args, contextValue: context });
              await client.query("commit");
            } catch (e) {
              await client.query("rollback");
              throw e;
            } finally {
              client.release();
            }
          }

          let data = Buffer.from(JSON.stringify(result), "utf8");
          const accept = accepts(req);
          const encoding = accept.encodings(["br", "gzip"]);

          if (encoding === "br") {
            data = await brotli(data, {
              params: {
                [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
                [constants.BROTLI_PARAM_QUALITY]: 5,
                [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
              },
            });

            res.setHeader("Content-Encoding", "br");
          } else if (encoding === "gzip") {
            data = await gzip(data, {
              level: 8,
            });

            res.setHeader("Content-Encoding", "gzip");
          }

          result[raw] = data;

          res.json = (data: any) => {
            const chunk = data[raw] || Buffer.from(JSON.stringify(data), "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.setHeader("Content-Length", chunk.length.toString());
            res.end(chunk);
          };

          return result;
        },
      };
    });
  } else {
    throw new Error();
  }

  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url && (req.url === "/graphql" || req.url === "/graphql?")) {
      await middleware(req as IncomingMessage & { url: string }, res);
      return true;
    }

    return false;
  };
};

function getOperation(args: ExecutionArgs) {
  const operation = getOperationAST(args.document, args.operationName)!;
  return operation.operation;
}
