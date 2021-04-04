import { createHash } from "crypto";
import { builtinModules } from "module";
import { resolve, sep } from "path";
import app, { Options as AppOptions } from "@mo36924/babel-preset-app";
import base64url from "@mo36924/base64url";
import prebuild from "@mo36924/rollup-plugin-commonjs-prebuild";
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
import { PreRenderedChunk, rollup, RollupOutput } from "rollup";
import { terser } from "rollup-plugin-terser";

type OutputFiles = { entry: string; files: { [path: string]: string } };

const md5 = (data: string) => base64url(createHash("md5").update(data).digest("base64"));

const getOutputFiles = ({ output }: RollupOutput): OutputFiles => {
  let entry = "";
  const files: { [name: string]: string } = Object.create(null);

  for (const chunk of output) {
    if (chunk.type === "chunk") {
      if (chunk.isEntry) {
        entry = chunk.fileName;
      }

      files[resolve(chunk.fileName)] = chunk.code;
    }
  }

  return {
    entry,
    files,
  };
};

const changeChunkName = async ({ entry, files }: OutputFiles) => {
  const fileNames = (chunkInfo: PreRenderedChunk) => {
    return md5(files[chunkInfo.facadeModuleId!]) + ".js";
  };

  const bundle = await rollup({ input: entry, plugins: [vfs(files)] });

  const rollupOutput = await bundle.generate({
    dir: "dist",
    format: "module",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: fileNames,
    chunkFileNames: fileNames,
  });

  await bundle.close();
  return getOutputFiles(rollupOutput);
};

export default async () => {
  let bundle = await rollup({
    input: "lib/index.client.ts",
    acornInjectPlugins: [jsx()],
    external: [],
    preserveEntrySignatures: false,
    context: "self",
    plugins: [
      _static(),
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
        babelHelpers: "bundled",
        sourceMaps: false,
        presets: [[app, { target: "client", env: "production" } as AppOptions]],
      }),
      terser({ ecma: 2020, module: true, compress: { passes: 10 } }),
    ],
  });

  const rollupOutput = await bundle.generate({
    dir: "dist",
    format: "module",
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
    preferConst: true,
    entryFileNames: "index.js",
    chunkFileNames: "index.js",
  });

  let outputFiles = getOutputFiles(rollupOutput);
  await bundle.close();
  outputFiles = await changeChunkName(outputFiles);
  outputFiles = await changeChunkName(outputFiles);

  bundle = await rollup({
    input: "lib/index.ts",
    acornInjectPlugins: [jsx()],
    external: builtinModules,
    preserveEntrySignatures: false,
    context: "globalThis",
    plugins: [
      prebuild({ packages: ["readable-stream"] }),
      replaceModule({ "pg-native": "module.exports = {};" }),
      _static(outputFiles.files),
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
        babelHelpers: "bundled",
        sourceMaps: true,
        presets: [
          [
            app,
            {
              target: "server",
              env: "production",
              replace: { ENTRY_MODULE: JSON.stringify(`/${outputFiles.entry}`) },
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
    entryFileNames: "index.js",
    chunkFileNames: "index.js",
  });

  await bundle.close();
};
