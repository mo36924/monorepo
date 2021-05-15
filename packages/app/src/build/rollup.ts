import { builtinModules } from "module";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import prebuild from "@mo36924/rollup-plugin-commonjs-prebuild";
import graphql from "@mo36924/rollup-plugin-graphql";
import graphqlSchema from "@mo36924/rollup-plugin-graphql-schema";
import replaceModule from "@mo36924/rollup-plugin-replace-module";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import jsx from "acorn-jsx";
import { OutputChunk, Plugin, rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import { batchWarnings } from "../util";
import { typescript } from "./plugins";

export default async (config: Config, target: "client" | "server", plugins: Plugin[]) => {
  const isClient = target === "client";
  const sourceMap = !isClient;
  const warnings = batchWarnings();

  const bundle = await rollup({
    input: config[target],
    acornInjectPlugins: [jsx()],
    external: isClient ? [] : builtinModules,
    preserveEntrySignatures: false,
    context: isClient ? "self" : "globalThis",
    onwarn: warnings.add,
    plugins: [
      ...plugins,
      typescript(),
      prebuild({ cache: true, prebuild: config.prebuild }),
      replaceModule(config.replaceModule),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      graphqlSchema(config),
      resolve(
        isClient
          ? {
              extensions: config.clientExtensions,
              browser: true,
              exportConditions: ["browser", "import", "require"],
              mainFields: ["browser", "module", "main"],
              preferBuiltins: false,
            }
          : {
              extensions: config.serverExtensions,
              browser: false,
              exportConditions: ["import", "require"],
              mainFields: ["module", "main"],
              preferBuiltins: true,
            },
      ),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: sourceMap }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/(core-js|tslib)\//],
        babelHelpers: "bundled",
        sourceMaps: sourceMap,
        presets: [[app, { target, env: "production" } as AppOptions]],
      }),
      terser(
        isClient
          ? { ecma: 2017, module: true, compress: { passes: 10 }, safari10: true }
          : { ecma: 2020, module: true, compress: { passes: 10 } },
      ),
    ],
  });

  const { output } = await bundle.generate({
    dir: "dist",
    format: "module",
    sourcemap: sourceMap,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: isClient ? "[hash].js" : "index.mjs",
    chunkFileNames: isClient ? "[hash].js" : "[name]-[hash].mjs",
  });

  await bundle.close();
  warnings.flush();
  return output.filter((chunk): chunk is OutputChunk => chunk.type === "chunk");
};
