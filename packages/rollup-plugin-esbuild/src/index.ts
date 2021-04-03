import { readFile } from "fs/promises";
import { build } from "esbuild";
import type { Plugin } from "rollup";

export default (names: string[]): Plugin => {
  const files: { [name: string]: null | { code: string; map: string } } = Object.create(null);

  return {
    name: "esbuild",
    async resolveId(source, importer, options) {
      if (!names.includes(source)) {
        return null;
      }

      const resolvedId = await this.resolve(source, importer, { ...options, skipSelf: true });
      const id = resolvedId?.id;

      if (!id || files[id]) {
        return resolvedId;
      }

      const { dependencies, peerDependencies } = JSON.parse(
        await readFile(`node_modules/${source}/package.json`, "utf8"),
      );

      const {
        outputFiles: [{ text: map }, { text: code }],
      } = await build({
        entryPoints: [id],
        outfile: `${id}?esbuild.js`,
        platform: "node",
        bundle: true,
        target: "node14",
        format: "cjs",
        write: false,
        sourcemap: true,
        external: Object.keys({ ...dependencies, ...peerDependencies }),
        define: { "process.env.NODE_ENV": '"production"' },
        minify: true,
      });

      files[id] = { code, map };
      return resolvedId;
    },
    load(id) {
      if (files[id]) {
        return files[id];
      }
    },
  };
};
