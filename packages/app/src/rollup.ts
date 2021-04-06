import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { builtinModules } from "module";
import { sep } from "path";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import base64url from "@mo36924/base64url";
import prebuild from "@mo36924/rollup-plugin-commonjs-prebuild";
import entrypoint from "@mo36924/rollup-plugin-entrypoint";
import graphql from "@mo36924/rollup-plugin-graphql";
import replaceModule from "@mo36924/rollup-plugin-replace-module";
import _static from "@mo36924/rollup-plugin-static";
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
import getEntry from "./get-entry";
import renameChunkNames, { getChunks } from "./rename-chunk-names";

type File = string | Buffer;
type Files = { [path: string]: File };

const favicon = async () => {
  let fileName: string | undefined;
  let data: Buffer | undefined;

  try {
    data = await readFile("favicon.ico");
    const hash = base64url(createHash("sha256").update(data).digest("base64"));
    fileName = `${hash}.ico`;
  } catch {}

  return { fileName, data };
};

const module = async () => {
  const bundle = await rollup({
    input: "lib/index.client.ts",
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
        extensions: [
          ".client.tsx",
          ".client.jsx",
          ".client.ts",
          ".client.mjs",
          ".client.js",
          ".client.cjs",
          ".client.json",
          ".tsx",
          ".jsx",
          ".ts",
          ".mjs",
          ".js",
          ".cjs",
          ".json",
        ],
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

  const result = renameChunkNames(output);
  await bundle.close();
  return result;
};

const nomodule = async () => {
  const bundle = await rollup({
    input: "lib/index.client.ts",
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
        extensions: [
          ".client.tsx",
          ".client.jsx",
          ".client.ts",
          ".client.mjs",
          ".client.js",
          ".client.cjs",
          ".client.json",
          ".tsx",
          ".jsx",
          ".ts",
          ".mjs",
          ".js",
          ".cjs",
          ".json",
        ],
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
    dir: "dist",
    format: "module",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "[name]-[hash]-nomodule.js",
    chunkFileNames: "[name]-[hash]-nomodule.js",
  });

  const chunks = renameChunkNames(output);
  const files = Object.fromEntries(chunks.map(({ fileName, code }) => [fileName, code]));
  await bundle.close();

  const _bundle = await rollup({
    input: getEntry(chunks),
    preserveEntrySignatures: false,
    context: "self",
    plugins: [vfs(files), terser({ ecma: 5, safari10: true, compress: { passes: 10 } })],
  });

  const _output = await _bundle.generate({
    dir: "dist",
    format: "system",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "[name].js",
    chunkFileNames: "[name].js",
  });

  const result = getChunks(_output);
  await _bundle.close();
  return result;
};

export default async () => {
  const { fileName: faviconEntry, data: faviconData } = await favicon();
  const moduleOutput = await module();
  const nomoduleOutput = await nomodule();

  const files: Files = Object.create(null);

  if (faviconEntry && faviconData) {
    files[faviconEntry] = faviconData;
  }

  for (const { fileName, code } of [...moduleOutput, ...nomoduleOutput]) {
    files[fileName] = code;
  }

  const bundle = await rollup({
    input: "lib/index.ts",
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    plugins: [
      _static(),
      prebuild({ packages: ["readable-stream"] }),
      replaceModule({ "pg-native": "module.exports = {};" }),
      entrypoint({
        entrypoint: {
          favicon: faviconEntry,
          module: getEntry(moduleOutput),
          nomodule: getEntry(nomoduleOutput),
        },
        files,
      }),
      typescript({
        sourceMap: true,
        inlineSourceMap: false,
        inlineSources: true,
      }),
      json({ compact: true, namedExports: true, preferConst: true }),
      graphql(),
      alias({
        entries: [{ find: /^~\/(.*?)$/, replacement: process.cwd().split(sep).join("/") + "/$1" }],
      }),
      _resolve({
        extensions: [
          ".server.tsx",
          ".server.jsx",
          ".server.ts",
          ".server.mjs",
          ".server.js",
          ".server.cjs",
          ".server.json",
          ".tsx",
          ".jsx",
          ".ts",
          ".mjs",
          ".js",
          ".cjs",
          ".json",
          ".node",
        ],
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
    dir: "dist",
    format: "module",
    sourcemap: true,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
  });

  await bundle.close();
};
