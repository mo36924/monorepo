import { existsSync } from "fs";
import devServer from "@mo36924/dev-server";
import databaseSchemaGenerator, { Options as databaseSchemaOptions } from "@mo36924/graphql-database-schema-generator";
import graphqlSchemaGenerator from "@mo36924/graphql-schema-generator";
import routeGenerator, { Options as routeGeneratorOptions } from "@mo36924/route-generator";

type Options = {
  watch?: boolean;
  routes?: Omit<routeGeneratorOptions, "watch">;
  graphql?: {
    model?: string;
    schema?: string;
  };
  database?: Omit<databaseSchemaOptions, "watch" | "graphql">;
  main?: string;
  browser?: string;
  server?: {
    input?: string;
  };
  client?: {
    input?: string;
  };
};

const getOptions = (options: Options = {}) => {
  options = {
    watch: process.env.NODE_ENV !== "production",
    main: "dist/server/index.js",
    browser: "dist/client/index.js",
    ...options,
  };

  options.server = {
    input: existsSync("server/index.ts") ? "server/index.ts" : "server/index.tsx",
    ...options.server,
  };

  options.client = {
    input: existsSync("client/index.ts") ? "client/index.ts" : "client/index.tsx",
    ...options.client,
  };

  return options;
};

export default async (options: Options = {}) => {
  options = getOptions(options);
  const watch = options.watch;
  const schema = options.graphql?.schema ?? "graphql/schema.gql";
  await routeGenerator({ ...options.routes, watch });
  await graphqlSchemaGenerator({ ...options.graphql, watch, schema });
  await databaseSchemaGenerator({ ...options.database, watch, graphql: schema });
  watch && devServer(options);
};
