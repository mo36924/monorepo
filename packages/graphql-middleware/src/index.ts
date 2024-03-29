import { readFile } from "fs/promises";
import { database, databaseDevelopment, graphql } from "@mo36924/config";
import type { MiddlewareFactory } from "@mo36924/http-server";

export default (): MiddlewareFactory => async (server) => {
  const config = process.env.NODE_ENV === "development" ? databaseDevelopment : database;
  let gql: string;

  try {
    gql = await readFile(graphql, "utf8");
  } catch {
    return;
  }

  // const schema = fixSchema(gql);
  // const ast = parse(schema);
  let middlewareFactory!: MiddlewareFactory;

  if (config.name === "postgres") {
    // const mod = await import("@mo36924/graphql-postgres-middleware");
    //middlewareFactory = mod.default({ ...config, ast });
  } else {
    // const mod = await import("@mo36924/graphql-postgres-middleware");
    //middlewareFactory = mod.default({ ...config, ast });
  }

  const middleware = await middlewareFactory(server);
  return middleware;
};
