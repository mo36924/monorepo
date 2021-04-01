import { resolve } from "path";
import type { Plugin } from "rollup";

export type Options = { [path: string]: string };

export default (options: Options = {}): Plugin => {
  const paths: Options = Object.create(null);

  for (const [path, data] of Object.entries(options)) {
    paths[resolve(path)] = data;
  }

  return {
    name: "vfs",
    load(id) {
      return paths[id] ?? null;
    },
  };
};
