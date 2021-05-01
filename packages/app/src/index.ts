import type { Config, PartialConfig } from "@mo36924/config";
import * as config from "@mo36924/config";
import pageGenerator from "@mo36924/page-generator";
import graphqlTypeGenerator from "./graphql-type-generator";
import tsconfig from "./tsconfig";

export default async (partialConfig: PartialConfig = {}) => {
  const _config: Config = { ...config, ...(partialConfig as any) };
  const watch = _config.watch;
  process.env.NODE_ENV = watch ? "development" : "production";
  await tsconfig();
  await graphqlTypeGenerator(config);
  await pageGenerator({ ...config.page, watch });
  const mod = watch ? await import("./dev") : await import("./build");
  await mod.default(_config);
};
