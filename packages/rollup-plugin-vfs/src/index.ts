import { resolve } from "path";
import type { Plugin } from "rollup";

export type Options = { [path: string]: string };

export default (options: Options = {}): Plugin => {
  const paths: { [path: string]: string | undefined } = Object.create(null);

  for (const [path, data] of Object.entries(options)) {
    paths[resolve(path)] = data;
  }

  return {
    name: "vfs",
    async resolveId(source, importer, options) {
      if (importer == null) {
        const resolvedId = await this.resolve(source, importer, { ...options, skipSelf: true });
        return resolvedId ?? resolve(source);
      }
    },
    load(id) {
      return paths[id];
    },
  };
};
