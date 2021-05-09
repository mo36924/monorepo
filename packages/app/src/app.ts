import type { Config, PartialConfig } from "@mo36924/config";
import _config from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import graphql from "./graphql";
import inject from "./inject";
import tsconfig from "./tsconfig";

export default async (partialConfig: PartialConfig) => {
  const config: Config = { ..._config, ...(partialConfig as any) };
  const promise = config.watch ? import("./dev") : import("./build");
  await pageGenerator(config.page);
  await graphql(config);
  await inject(config);
  await tsconfig();
  (await promise).default(config);
};
