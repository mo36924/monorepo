import * as entrypoint from "@mo36924/entrypoint";
import cache from "@mo36924/rollup-plugin-cache";
import type { Plugin, ResolvedId } from "rollup";

export type Options = {
  files?: { [path: string]: string | Buffer };
  entrypoint?: Partial<{ [entry in keyof typeof entrypoint]: string }>;
};

const entrypointModule = "@mo36924/entrypoint";
const normalize = (path: string) => path.replace(/^\/?/, "/");

export default (options: Options = {}): Plugin => {
  const _entrypoint = Object.assign(Object.create(null), options.entrypoint);

  const entrypointModuleCode = Object.entries(entrypoint)
    .map(([key, value]) => `export const ${key} = ${JSON.stringify(normalize(_entrypoint[key] ?? value))};\n`)
    .join("");

  const { buildStart, resolveId, load } = cache({ middleware: "@mo36924/entrypoint-middleware", files: options.files });
  let resolvedId: ResolvedId | null = null;

  return {
    name: "entrypoint",
    async buildStart(options) {
      await buildStart.call(this, options);
      resolvedId = await this.resolve(entrypointModule, undefined, { skipSelf: true });
    },
    resolveId(source, importer, options) {
      if (source === entrypointModule) {
        return resolvedId;
      }

      return resolveId.call(this, source, importer, options);
    },
    load(id) {
      if (id === resolvedId?.id) {
        return entrypointModuleCode;
      }

      return load.call(this, id);
    },
  };
};
