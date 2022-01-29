import { readFile } from "fs/promises";
import { extname, join } from "path";
import { promisify } from "util";
import postcssModules from "@mo36924/postcss-modules";
import { removeExtension } from "@mo36924/util-node";
import type { Plugin } from "esbuild";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import sass from "sass";

const cwd = process.cwd();
const env = process.env.NODE_ENV;
const filter = /\.(css|pcss|postcss|sass|scss)\.module$/;
const sassRender = promisify(sass.render);

export default (): Plugin => {
  return {
    name: "css-modules",
    async setup(build) {
      build.onResolve({ filter }, (args) => {
        return { path: join(args.resolveDir, args.path) };
      });

      build.onLoad({ filter }, async (args) => {
        const path = removeExtension(args.path);
        let data: string | undefined;

        switch (extname(path)) {
          case ".css":
          case ".pcss":
          case ".postcss": {
            const context = { from: path, cwd, env };

            const [css, { plugins, options }] = await Promise.all([
              readFile(path, "utf8"),
              postcssrc(context).catch(() => ({ plugins: [], options: { from: path } })),
            ]);

            await postcss(
              ...plugins,
              postcssModules({
                write(result) {
                  data = result.generator(result);
                },
              }),
            ).process(css, options);

            break;
          }
          case ".sass":
          case ".scss": {
            const result = await sassRender({ file: path });

            await postcss(
              postcssModules({
                write(result) {
                  data = result.generator(result);
                },
              }),
            ).process(result!.css, { from: path });

            break;
          }
          default:
            throw new Error("Unsupported extension");
        }

        return { loader: "js", contents: data || "export {};" };
      });
    },
  };
};
