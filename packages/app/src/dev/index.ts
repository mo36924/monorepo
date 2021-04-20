import type { Config } from "@mo36924/config";
import graphqlTypescript from "./graphql-typescript";

export default async (config: Config) => {
  process.env.NODE_ENV = "development";
  await graphqlTypescript(config);
};
