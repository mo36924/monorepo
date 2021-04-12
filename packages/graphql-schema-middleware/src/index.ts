import { readFile } from "fs/promises";
import { database, graphql } from "@mo36924/config";
import { schema as buildSchema } from "@mo36924/graphql-schema";
import type { MiddlewareFactory } from "@mo36924/http-server";
import { parse } from "graphql";

export default (): MiddlewareFactory => async (server) => {
  const mod = await import("@mo36924/graphql-postgres-json-middleware");
  const gql = await readFile(graphql, "utf8");
  const schema = buildSchema(gql);
  const ast = parse(schema);
  const middlewareFactory = mod.default({ ast, main: database.main, replica: database.replica });
  const middleware = await middlewareFactory(server);
  return middleware;
};
