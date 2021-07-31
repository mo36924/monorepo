import { BinaryToTextEncoding, createHash } from "crypto";
import { readFile } from "fs/promises";
import { extname, join, resolve, sep } from "path";
import { promisify } from "util";
import { transformAsync } from "@babel/core";
import presetEnv, { Options as PresetEnvOptions } from "@babel/preset-env";
import { normalizePath, removeExtension, writeFile } from "@mo36924/util-node";
import cssnano from "cssnano";
import advanced from "cssnano-preset-advanced";
import { build, Plugin } from "esbuild";
import postcss from "postcss";
import postcssrc from "postcss-load-config";
import sass from "sass";
import { minify as terser } from "terser";

const sassRender = promisify(sass.render);

export type Options = {
  outdir?: string;
  algorithm?: string;
  encoding?: BinaryToTextEncoding;
};

export default (options: Options = {}): Plugin => {
  const cwd = process.cwd();
  const env = process.env.NODE_ENV;
  const outdir = resolve(options.outdir ?? "assets");
  const algorithm = options.algorithm ?? "sha256";
  const encoding = options.encoding ?? "hex";
  const hash = (data: string | Uint8Array) => createHash(algorithm).update(data).digest(encoding);

  if (!outdir.startsWith(cwd + sep)) {
    throw new Error("Out directory must be in the current directory.");
  }

  const base = normalizePath(outdir.slice(cwd.length)) + "/";
  const filter = /\.(css|pcss|postcss|sass|scss|tsx|ts|jsx|mjs|js|cjs|json)\.asset$/;

  return {
    name: "asset",
    async setup(_build) {
      const minify = !_build.initialOptions.watch;

      const supportArrowFunction =
        minify &&
        (await transformAsync("()=>{}", {
          babelrc: false,
          configFile: false,
          presets: [[presetEnv, { bugfixes: true, modules: false, useBuiltIns: false } as PresetEnvOptions]],
        }))!.code!.includes("=>");

      _build.onResolve({ filter }, (args) => {
        return { path: join(args.resolveDir, args.path) };
      });

      _build.onLoad({ filter }, async (args) => {
        const path = removeExtension(args.path);
        let ext: ".css" | ".js" | ".json";
        let data: string | Uint8Array;

        switch (extname(path)) {
          case ".css":
          case ".pcss":
          case ".postcss": {
            const context = { from: path, cwd, env };

            const [css, { plugins, options }] = await Promise.all([
              readFile(path, "utf8"),
              postcssrc(context).catch(() => ({ plugins: [], options: { from: path } })),
            ]);

            const result = await postcss(plugins).process(css, options);
            ext = ".css";
            data = result.css;
            break;
          }
          case ".sass":
          case ".scss": {
            const result = await sassRender({ file: path });
            ext = ".css";
            data = result.css;
            break;
          }
          case ".tsx":
          case ".ts":
          case ".jsx":
          case ".mjs":
          case ".js":
          case ".cjs": {
            const result = await build({
              entryPoints: [path],
              bundle: true,
              format: "esm",
              write: false,
              minify,
            });

            ext = ".js";
            data = result.outputFiles[0].contents;
            break;
          }
          case ".json": {
            ext = ".json";
            data = await readFile(path, "utf8");
            break;
          }
          default:
            throw new Error("Unsupported extension");
        }

        if (minify) {
          if (typeof data !== "string") {
            if (Buffer.isBuffer(data)) {
              data = data.toString();
            } else {
              data = Buffer.from(data).toString();
            }
          }

          switch (ext) {
            case ".css": {
              const result = await postcss(cssnano({ preset: advanced({ autoprefixer: { add: true } }) })).process(
                data,
                {
                  from: path,
                },
              );

              data = result.css;
              break;
            }
            case ".js": {
              const result = await transformAsync(data, {
                babelrc: false,
                configFile: false,
                filename: path,
                presets: [[presetEnv, { bugfixes: true, modules: false, useBuiltIns: false } as PresetEnvOptions]],
              });

              data = `"use strict";(${supportArrowFunction ? "()=>" : "function()"}{${result!.code!}})()`;

              const _result = await terser(data, {
                ecma: 2020,
                module: true,
                safari10: true,
                compress: { passes: 10 },
              });

              data = _result.code!;
              break;
            }
            case ".json": {
              data = JSON.stringify(JSON.parse(data));
              break;
            }
          }
        }

        const name = hash(data) + ext;
        await writeFile(outdir + sep + name, data, { format: false });
        return { loader: "js", contents: `export default ${JSON.stringify(base + name)}` };
      });
    },
  };
};
