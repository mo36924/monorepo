import { builtinModules } from "module";
import { sep } from "path";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import type { Config } from "@mo36924/config";
import cache from "@mo36924/rollup-plugin-cache";
import prebuild from "@mo36924/rollup-plugin-commonjs-prebuild";
import _config from "@mo36924/rollup-plugin-config";
import graphql from "@mo36924/rollup-plugin-graphql";
import graphqlSchema from "@mo36924/rollup-plugin-graphql-schema";
import replaceModule from "@mo36924/rollup-plugin-replace-module";
import _static from "@mo36924/rollup-plugin-static";
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
import { module, nomodule } from "./client";
import css from "./css";
import favicon from "./favicon";
import rename from "./rename";

const server = async (config: Config) => {
  const bundle = await rollup({
    input: config.server,
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    plugins: [
      _static(),
      prebuild(["readable-stream", ["pg", "pg-pool"]]),
      replaceModule({ "pg-native": "module.exports = {};" }),
      _config(),
      cache(),
      typescript({
        sourceMap: true,
        inlineSourceMap: false,
        inlineSources: true,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      graphqlSchema(config),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.extensions.server,
        browser: false,
        exportConditions: ["import", "require"],
        mainFields: ["module", "main"],
        preferBuiltins: true,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: true }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/core-js\//],
        babelHelpers: "bundled",
        sourceMaps: true,
        presets: [
          [
            app,
            {
              target: "server",
              env: "production",
            } as AppOptions,
          ],
        ],
      }),
      terser({ ecma: 2020, module: true, compress: { passes: 10 } }),
    ],
  });

  const output = await bundle.generate({
    dir: config.dir,
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: config.base,
  });

  const entries = rename(output);
  await bundle.close();
  return entries;
};

export default async (config: Config) => {
  const _favicon = await favicon();
  const _module = await module();
  const _nomodule = await nomodule();
  const _server = await server(config);
  const _css = await css([..._module, ..._nomodule, ..._server].map(([, data]) => ({ extension: "js", raw: data })));
  const files = Object.fromEntries<string | Buffer>([_favicon, ..._module, ..._nomodule]);

  const bundle = await rollup({
    input: config.server,
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    plugins: [
      _static(),
      prebuild(["readable-stream", ["pg", "pg-pool"]]),
      replaceModule({ "pg-native": "module.exports = {};" }),
      _config({
        favicon: `/${_favicon[0]}`,
        css: `/${_css[0]}`,
        module: `/${_module[0][0]}`,
        nomodule: `/${_nomodule[0][0]}`,
      }),
      cache({ files }),
      typescript({
        sourceMap: true,
        inlineSourceMap: false,
        inlineSources: true,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      graphqlSchema(config),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.extensions.server,
        browser: false,
        exportConditions: ["import", "require"],
        mainFields: ["module", "main"],
        preferBuiltins: true,
      }),
      commonjs({ extensions: [".js", ".cjs"], ignoreGlobal: true, sourceMap: true }),
      babel({
        extensions: [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs"],
        babelrc: false,
        configFile: false,
        compact: false,
        exclude: [/\/node_modules\/core-js\//],
        babelHelpers: "bundled",
        sourceMaps: true,
        presets: [
          [
            app,
            {
              target: "server",
              env: "production",
            } as AppOptions,
          ],
        ],
      }),
      terser({ ecma: 2020, module: true, compress: { passes: 10 } }),
    ],
  });

  await bundle.write({
    dir: config.dir,
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: config.base,
  });

  await bundle.close();
};
