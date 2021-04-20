import type { Config, PartialConfig } from "@mo36924/config";
import * as config from "@mo36924/config";

export default async (partialConfig: PartialConfig = {}) => {
  const _config: Config = { ...config, ...(partialConfig as any) };
  const mod = _config.watch ? await import("./dev") : await import("./build");
  await mod.default(_config);
};
