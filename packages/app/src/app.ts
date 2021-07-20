import type { Config, PartialConfig } from "@mo36924/config";
import * as defaultConfig from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import { createObject } from "@mo36924/util";
import graphql from "./graphql";
import inject from "./inject";
import tsconfig from "./tsconfig";

export default async (partialConfig: PartialConfig) => {
  const config: Config = createObject(defaultConfig, partialConfig);
  await tsconfig();
  await inject(config);
  await pageGenerator(config.page);
  await graphql(config);
  const promise = config.watch ? import("./dev") : import("./build");
  (await promise).default(config);
};
