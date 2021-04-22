import type { Config } from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import tsconfig from "../tsconfig";
import graphqlTypescript from "./graphql-typescript";
import server from "./server";

export default async (config: Config) => {
  process.env.NODE_ENV = "development";
  await tsconfig();
  await pageGenerator({ ...config.page, watch: true });
  await graphqlTypescript(config);
  await server(config);
};
