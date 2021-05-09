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
import jsx from "acorn-jsx";
import { rollup } from "rollup";
import { terser } from "rollup-plugin-terser";
import css from "./css";
import _module from "./module";
import nomodule from "./nomodule";
import rename from "./rename";
import typescript from "./typescript-plugin";
import warnings from "./warnings";

const cwd = process.cwd();

const server = async (config: Config) => {
  const bundle = await rollup({
    input: config.main,
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    onwarn: warnings.add,
    plugins: [
      _static(),
      prebuild(["readable-stream", ["pg", "pg-pool"]]),
      replaceModule({ "pg-native": "module.exports = {};" }),
      _config(),
      cache(),
      typescript(config),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      graphqlSchema(config),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.serverExtensions,
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
    dir: config.dirname,
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: config.basename,
  });

  const entries = rename(output);
  await bundle.close();
  warnings.flush();
  return entries;
};

export default async (config: Config) => {
  const __module = await _module(config);
  const _nomodule = await nomodule(config);
  const _server = await server(config);

  const _css = await css(
    config,
    [..._server].map(([, data]) => ({ extension: "js", raw: data })),
  );

  const files = Object.fromEntries<string | Buffer>([]);

  const bundle = await rollup({
    input: config.main,
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    onwarn: warnings.add,
    plugins: [
      _static(),
      prebuild(["readable-stream", ["pg", "pg-pool"]]),
      replaceModule({ "pg-native": "module.exports = {};" }),
      // _config({
      //   css: `/${_css[0]}`,
      //   module: `/${__module[0][0]}`,
      //   nomodule: `/${_nomodule[0][0]}`,
      // }),
      cache({ files }),
      typescript(config),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      graphqlSchema(config),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: cwd.split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: config.serverExtensions,
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
    dir: config.dirname,
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: config.basename,
  });

  await bundle.close();
  warnings.flush();
};
