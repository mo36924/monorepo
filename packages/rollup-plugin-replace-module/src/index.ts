import { resolve } from "path";
import type { Plugin, ResolvedId } from "rollup";

export type Options = { [packageName: string]: string };

export default (options: Options = {}): Plugin => {
  const resolvedIds: { [packageName: string]: ResolvedId | string | undefined } = Object.create(null);
  const files: { [id: string]: string | undefined } = Object.create(null);

  return {
    name: "replace-module",
    async buildStart() {
      await Promise.all(
        Object.entries(options).map(async ([packageName, data]) => {
          const resolvedId = await this.resolve(packageName);

          if (resolvedId) {
            resolvedIds[packageName] = resolvedId;
            files[resolvedId.id] = data;
          } else {
            const id = resolve("node_modules", packageName, "index.js");
            resolvedIds[packageName] = id;
            files[id] = data;
          }
        }),
      );
    },
    resolveId(source) {
      return resolvedIds[source];
    },
    load(id) {
      return files[id];
    },
  };
};
