import { sep } from "path";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import graphql from "@mo36924/rollup-plugin-graphql";
import typescriptTranspileModule from "@mo36924/rollup-plugin-typescript";
import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import _resolve from "@rollup/plugin-node-resolve";
import jsx from "acorn-jsx";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import ts from "typescript";
import rename from "./rename";
import typescript from "./typescript-plugin";
import warnings from "./warnings";

export default async (config: Config) => {
  const bundle = await rollup({
    input: config.client,
    acornInjectPlugins: [jsx()],
    external: [],
    preserveEntrySignatures: false,
    context: "self",
    onwarn: warnings.add,
    plugins: [
      typescript(config),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: config.rootDir.split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.extensions.client,
        browser: true,
        exportConditions: ["browser", "import", "require"],
        mainFields: ["browser", "module", "main"],
        preferBuiltins: false,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: false }),
      typescriptTranspileModule({ target: ts.ScriptTarget.ES2017 }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/(core-js|tslib)\//],
        babelHelpers: "bundled",
        sourceMaps: false,
        presets: [[app, { target: "client", env: "production" } as AppOptions]],
      }),
      terser({ ecma: 2017, safari10: true, module: true, compress: { passes: 10 } }),
    ],
  });

  const output = await bundle.generate({
    dir: "dist",
    format: "module",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "[name]-[hash].js",
    chunkFileNames: "[name]-[hash].js",
  });

  const entries = rename(output);
  await bundle.close();
  warnings.flush();
  return entries;
};
