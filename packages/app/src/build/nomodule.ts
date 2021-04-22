import { sep } from "path";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import graphql from "@mo36924/rollup-plugin-graphql";
import typescriptTranspileModule from "@mo36924/rollup-plugin-typescript";
import vfs from "@mo36924/rollup-plugin-vfs";
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
    input: config.nomodule,
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
      typescriptTranspileModule({ target: ts.ScriptTarget.ES5, downlevelIteration: true }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/(core-js|tslib)\//],
        babelHelpers: "bundled",
        sourceMaps: false,
        presets: [[app, { target: "client", env: "production", nomodule: true } as AppOptions]],
      }),
      terser({ ecma: 5, safari10: true, module: true, compress: { passes: 10 } }),
    ],
  });

  const output = await bundle.generate({
    dir: config.dirname,
    format: "module",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "[name]-[hash]-nomodule.js",
    chunkFileNames: "[name]-[hash]-nomodule.js",
  });

  const entries = rename(output);
  const files = Object.fromEntries(entries);
  await bundle.close();
  warnings.flush();

  const _bundle = await rollup({
    input: entries[0][0],
    preserveEntrySignatures: false,
    context: "self",
    plugins: [vfs(files), terser({ ecma: 5, safari10: true, compress: { passes: 10 } })],
  });

  const _output = await _bundle.generate({
    dir: config.dirname,
    format: "system",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "[name].js",
    chunkFileNames: "[name].js",
  });

  const _entries = rename(_output);
  await _bundle.close();
  return _entries;
};
