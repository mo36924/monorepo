import type { Config, PartialConfig } from "@mo36924/config";
import * as config from "@mo36924/config";
import devServer from "@mo36924/dev-server";
import pageGenerator from "@mo36924/page-generator";
import server from "./server";

export default async (partialConfig: PartialConfig = {}) => {
  const _config: Config = { ...config, ...partialConfig };
  const { watch } = _config;
  await pageGenerator({ ..._config.page, watch });

  if (watch) {
    await devServer(_config);
  } else {
    await server(_config);
  }
};
