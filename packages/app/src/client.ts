import { sep } from "path";
import { fileURLToPath } from "url";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import * as config from "@mo36924/config";
import graphql from "@mo36924/rollup-plugin-graphql";
import vfs from "@mo36924/rollup-plugin-vfs";
import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import _resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
// @ts-ignore
import jsx from "acorn-jsx";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import rename from "./rename";

export const module = async () => {
  const bundle = await rollup({
    input: fileURLToPath(new URL(config.module, "file:///")),
    acornInjectPlugins: [jsx()],
    external: [],
    preserveEntrySignatures: false,
    context: "self",
    plugins: [
      typescript({
        sourceMap: false,
        inlineSourceMap: false,
        inlineSources: false,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.extensions.client,
        browser: true,
        exportConditions: ["browser", "import", "require"],
        mainFields: ["browser", "module", "main"],
        preferBuiltins: false,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: false }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/core-js\//],
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
  return entries;
};

export const nomodule = async () => {
  const bundle = await rollup({
    input: fileURLToPath(new URL(config.nomodule, "file:///")),
    acornInjectPlugins: [jsx()],
    external: [],
    preserveEntrySignatures: false,
    context: "self",
    plugins: [
      typescript({
        sourceMap: false,
        inlineSourceMap: false,
        inlineSources: false,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.extensions.client,
        browser: true,
        exportConditions: ["browser", "import", "require"],
        mainFields: ["browser", "module", "main"],
        preferBuiltins: false,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: false }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/core-js\//],
        babelHelpers: "bundled",
        sourceMaps: false,
        presets: [[app, { target: "client", env: "production", nomodule: true } as AppOptions]],
      }),
      terser({ ecma: 5, safari10: true, module: true, compress: { passes: 10 } }),
    ],
  });

  const output = await bundle.generate({
    dir: config.dir,
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

  const _bundle = await rollup({
    input: entries[0][0],
    preserveEntrySignatures: false,
    context: "self",
    plugins: [vfs(files), terser({ ecma: 5, safari10: true, compress: { passes: 10 } })],
  });

  const _output = await _bundle.generate({
    dir: config.dir,
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
