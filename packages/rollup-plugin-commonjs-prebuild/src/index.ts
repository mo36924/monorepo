import { readFile } from "fs/promises";
import { build, BuildOptions } from "esbuild";
import type { Plugin, ResolvedId } from "rollup";

export type Options = { packages?: string[] } & Pick<BuildOptions, "define" | "target">;

export default (options: Options = {}): Plugin => {
  const { packages = [], ...buildOptions } = options;
  const resolvedIds: { [packageName: string]: ResolvedId | undefined } = Object.create(null);
  const resolvedPackages: { [id: string]: string } = Object.create(null);
  const files: { [name: string]: Promise<{ code: string; map: string }> } = Object.create(null);

  return {
    name: "commonjs-prebuild",
    async buildStart() {
      await Promise.all(
        packages.map(async (packageName) => {
          const resolvedId = await this.resolve(packageName);

          if (resolvedId) {
            resolvedIds[packageName] = resolvedId;
            resolvedPackages[resolvedId.id] = packageName;
          }
        }),
      );
    },
    resolveId(source) {
      return resolvedIds[source];
    },
    load(id) {
      const packageName = resolvedPackages[id];

      if (packageName == null) {
        return;
      }

      files[id] ??= (async () => {
        const { dependencies, peerDependencies } = JSON.parse(
          await readFile(`node_modules/${packageName}/package.json`, "utf8"),
        );

        const {
          outputFiles: [{ text: map }, { text: code }],
        } = await build({
          platform: "node",
          target: "node14",
          define: { "process.env.NODE_ENV": '"production"' },
          ...buildOptions,
          entryPoints: [id],
          outfile: `${id}?esbuild.js`,
          bundle: true,
          format: "cjs",
          write: false,
          sourcemap: true,
          external: Object.keys({ ...dependencies, ...peerDependencies }),
          minify: true,
        });

        return { code, map };
      })();

      return files[id];
    },
  };
};
