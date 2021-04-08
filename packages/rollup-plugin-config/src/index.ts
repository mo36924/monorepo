import * as config from "@mo36924/config";
import type { Plugin, ResolvedId } from "rollup";

export type Options = Partial<typeof config>;

export default (options: Options = {}): Plugin => {
  const _options = Object.assign(Object.create(null), options);
  const configModule = "@mo36924/config";

  const configModuleCode = Object.entries(config)
    .map(([key, value]) => `export const ${key} = ${JSON.stringify(_options[key] ?? value)};\n`)
    .join("");

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
        return configModuleCode;
      }
    },
  };
};
