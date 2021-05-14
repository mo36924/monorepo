import type { Config } from "@mo36924/config";
import { dataToEsm } from "@rollup/pluginutils";
import type { Plugin, ResolvedId } from "rollup";

export default (config: Partial<Config>): Plugin => {
  const configModule = "@mo36924/config";
  let resolvedId: ResolvedId | null = null;
  return {
    name: "config",
    async buildStart() {
      resolvedId = await this.resolve(configModule, undefined, { skipSelf: true });
    },
    resolveId(source) {
      if (source === configModule) {
        return resolvedId;
      }
    },
    load(id) {
      if (id === resolvedId?.id) {
        return dataToEsm(config, { compact: true, namedExports: true, objectShorthand: true, preferConst: true });
      }
    },
  };
};
