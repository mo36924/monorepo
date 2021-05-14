import type { Plugin } from "rollup";

export default (pathnames: { [path: string]: string } = Object.create(null)): Plugin => {
  return {
    name: "asset",
    load(id) {
      if (id.endsWith(".css")) {
        if (!pathnames[id]) {
          throw new Error(`Could not load ${JSON.stringify(id)}`);
        }

        return `export default ${JSON.stringify(pathnames[id])};`;
      }
    },
  };
};
