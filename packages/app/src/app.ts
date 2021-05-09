import type { Config, PartialConfig } from "@mo36924/config";
import _config from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import graphql from "./graphql";
import tsconfig from "./tsconfig";

export default async (partialConfig: PartialConfig) => {
  const config: Config = { ..._config, ...(partialConfig as any) };
  const promise = config.watch ? import("./dev") : import("./build");
  await tsconfig();
  await graphql(config);
  await pageGenerator(config.page);
  (await promise).default(config);
};
