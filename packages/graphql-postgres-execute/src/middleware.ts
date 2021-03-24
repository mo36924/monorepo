import graphqlMiddleware from "@mo36924/graphql-middleware";
import type { MiddlewareFactory } from "@mo36924/http-server";
import { execute, ExecutionArgs, getOperationAST, GraphQLSchema } from "graphql";
import pg, { PoolConfig } from "pg";
import fieldResolver from "./field-resolver";

type Options = { schema: GraphQLSchema; main: PoolConfig; replica?: PoolConfig };

export default (options: Options): MiddlewareFactory => async (server) => {
  const schema = options.schema;
  const main = new pg.Pool(options.main);
  const replica = new pg.Pool(options.replica ?? options.main);

  const middleware = await graphqlMiddleware({
    schema: schema,
    execute: async (_req, _res, schema, document, variables, operationName) => {
      const executionArgs: ExecutionArgs = {
        schema,
        document,
        variableValues: variables,
        operationName,
        fieldResolver,
      };

      const operation = getOperation(executionArgs);

      if (operation === "query") {
        executionArgs.contextValue = {
          date: new Date(),
          ids: Object.create(null),
          db: (query: string) => replica.query(query),
        };

        return await execute(executionArgs);
      }

      const client = await main.connect();

      try {
        await client.query("begin");

        executionArgs.contextValue = {
          date: new Date(),
          ids: Object.create(null),
          db: (query: string) => client.query(query),
        };

        const result = await execute(executionArgs);
        await client.query("commit");
        return result;
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    },
  })(server);

  return middleware;
};

function getOperation(args: ExecutionArgs) {
  const operation = getOperationAST(args.document, args.operationName)!;
  return operation.operation;
}
