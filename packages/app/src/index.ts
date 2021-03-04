import graphqlSchema, { Options as graphqlSchemaOptions } from "@mo36924/graphql-schema-generator";
import routeGenerator, { Options as routeGeneratorOptions } from "@mo36924/route-generator";

type Options = {
  routes?: routeGeneratorOptions;
  graphql?: {
    schema?: graphqlSchemaOptions;
  };
};

export default async (options: Options = {}) => {
  await routeGenerator(options.routes);
  await graphqlSchema(options.graphql?.schema);
};
