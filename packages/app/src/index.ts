import type { Options as injectOptions } from "@mo36924/babel-plugin-inject";
import devServer from "@mo36924/dev-server";
import databaseSchemaGenerator, { Options as databaseSchemaOptions } from "@mo36924/graphql-database-schema-generator";
import graphqlSchemaGenerator from "@mo36924/graphql-schema-generator";
import injectGenerator from "@mo36924/inject-generator";
import routeGenerator, { Options as routeGeneratorOptions } from "@mo36924/route-generator";

type Options = {
  watch?: boolean;
  jsx?: "react" | "preact";
  inject?: {
    path?: string;
    declarations?: injectOptions;
  };
  routes?: Omit<routeGeneratorOptions, "watch">;
  graphql?: {
    model?: string;
    schema?: string;
  };
  database?: Omit<databaseSchemaOptions, "watch" | "graphql">;
};

export default async (options: Options = {}) => {
  const watch = !!(options.watch ?? process.env.NODE_ENV !== "production");
  const schema = options.graphql?.schema ?? "graphql/schema.gql";
  await injectGenerator({ path: options.inject?.path });
  await routeGenerator({ ...options.routes, watch });
  await graphqlSchemaGenerator({ ...options.graphql, watch, schema });
  await databaseSchemaGenerator({ ...options.database, watch, graphql: schema });
  watch && devServer({ inject: options.inject?.declarations });
};
