import type { Options as injectOptions } from "@mo36924/babel-plugin-inject";
import devServer from "@mo36924/dev-server";
import databaseSchemaGenerator, { Options as databaseSchemaOptions } from "@mo36924/graphql-database-schema-generator";
import graphqlSchemaGenerator from "@mo36924/graphql-schema-generator";
import pageGenerator, { Options as pageGeneratorOptions } from "@mo36924/page-generator";
import rollup from "./rollup";

export type Options = {
  watch?: boolean;
  jsx?: "react" | "preact";
  inject?: injectOptions;
  page?: Omit<pageGeneratorOptions, "watch">;
  graphql?: {
    model?: string;
    schema?: string;
  };
  database?: Omit<databaseSchemaOptions, "watch" | "graphql">;
};

export default async (options: Options = {}) => {
  const watch = !!(options.watch ?? process.env.NODE_ENV !== "production");
  const schema = options.graphql?.schema ?? "graphql/schema.gql";
  await pageGenerator({ ...options.page, watch });
  await graphqlSchemaGenerator({ ...options.graphql, watch, schema });
  await databaseSchemaGenerator({ ...options.database, watch, graphql: schema });

  if (watch) {
    await devServer({ inject: options.inject });
  } else {
    await rollup();
  }
};
