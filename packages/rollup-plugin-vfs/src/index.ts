import { resolve } from "path";
import type { Plugin } from "rollup";

export default (options: { [path: string]: string } = {}): Plugin => {
  const paths: { [path: string]: string | undefined } = Object.create(null);

  for (const [path, data] of Object.entries(options)) {
    paths[resolve(path)] = data;
  }

  return {
    name: "vfs",
    async resolveId(source, importer, options) {
      const resolvedId = await this.resolve(source, importer, { ...options, skipSelf: true });

      if (resolvedId) {
        return resolvedId;
      }

      const path = resolve(importer ?? "index.js", "..", source);

      if (path in paths) {
        return path;
      }

      let _path = `${path}.js`;

      if (_path in paths) {
        return _path;
      }

      _path = `${path}.json`;

      if (_path in paths) {
        return _path;
      }
    },
    load(id) {
      return paths[id];
    },
  };
};
