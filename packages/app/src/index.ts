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
  server?: {
    input?: string;
  };
};

export default async (options: Options = {}) => {
  const watch = !!options.watch || process.env.NODE_ENV === "development";
  const schema = options.graphql?.schema || "graphql/schema.gql";
  await routeGenerator({ ...options.routes, watch });
  await graphqlSchemaGenerator({ ...options.graphql, watch, schema });
  await databaseSchemaGenerator({ ...options.database, watch, graphql: schema });
  watch && devServer(options);
};
