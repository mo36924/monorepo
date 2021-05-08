import type { Config, PartialConfig } from "@mo36924/config";
import _config from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import build from "./build";
import dev from "./dev";
import graphql from "./graphql";
import tsconfig from "./tsconfig";

export default async (partialConfig: PartialConfig) => {
  const config: Config = { ..._config, ...(partialConfig as any) };
  await tsconfig();
  await graphql(config);
  await pageGenerator(config.page);
  await (config.watch ? dev : build)(config);
};
