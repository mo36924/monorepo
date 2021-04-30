import type { Config } from "@mo36924/config";
import graphqlTypescript from "./graphql-typescript";
import server from "./server";

export default async (config: Config) => {
  await graphqlTypescript(config);
  await server(config);
};
