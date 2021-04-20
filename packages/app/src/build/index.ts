import type { Config } from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import graphqlTypescript from "./graphql-typescript";

export default async (config: Config) => {
  process.env.NODE_ENV = "production";
  await pageGenerator({ ...config.page, watch: false });
  await graphqlTypescript(config);
};
