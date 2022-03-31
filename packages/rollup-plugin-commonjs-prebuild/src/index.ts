import { basename, dirname } from "path";
import { FilterPattern, createFilter } from "@rollup/pluginutils";
import { BuildOptions, build } from "esbuild";
import { Plugin } from "rollup";

export type Options = { include?: FilterPattern; exclude?: FilterPattern };

const name = "commonjs-prebuild";

const buildOptions: BuildOptions & { write: false } = {
  platform: "node",
  target: `node${process.version.slice(1)}`,
  bundle: true,
  sourcemap: true,
  format: "esm",
  write: false,
  allowOverwrite: true,
  plugins: [
    {
      name: "node-externals",
      setup(build) {
        build.onResolve({ filter: /^[@\w]/ }, (args) => {
          return { external: args.kind !== "entry-point" };
        });
      },
    },
  ],
};

export default (options: Options): Plugin => {
  const filter = createFilter(options.include, options.exclude);
  return {
    name,
    async transform(code, id) {
      if (!filter(id)) {
        return null;
      }

      const { outputFiles } = await build({
        ...buildOptions,
        stdin: { contents: code, resolveDir: dirname(id), sourcefile: basename(id) },
        outfile: `${id}.${name}.js`,
      });

      return {
        code: outputFiles.find(({ path }) => path.endsWith(".js"))!.text,
        map: outputFiles.find(({ path }) => path.endsWith(".map"))!.text,
      };
    },
  };
};
