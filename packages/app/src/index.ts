import databaseSchemaGenerator, { Options as databaseSchemaOptions } from "@mo36924/graphql-database-schema-generator";
import graphqlSchemaGenerator, { Options as graphqlSchemaOptions } from "@mo36924/graphql-schema-generator";
import routeGenerator, { Options as routeGeneratorOptions } from "@mo36924/route-generator";

type Options = {
  routes?: routeGeneratorOptions;
  graphql?: {
    schema?: graphqlSchemaOptions;
    database?: databaseSchemaOptions;
  };
};

export default async (options: Options = {}) => {
  await routeGenerator(options.routes);
  await graphqlSchemaGenerator(options.graphql?.schema);
  await databaseSchemaGenerator(options.graphql?.database);
};
