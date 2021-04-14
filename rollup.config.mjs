import { parse, relative, resolve } from "path";
import constant from "@babel/plugin-transform-react-constant-elements";
import env from "@babel/preset-env";
import react from "@babel/preset-react";
import typescript from "@babel/preset-typescript";
import { babel } from "@rollup/plugin-babel";
import _resolve from "babel-plugin-resolve";
import subpath from "babel-plugin-resolve-subpath";
import glob from "fast-glob";
import MagicString from "magic-string";
import dts from "rollup-plugin-dts";
import importMetaUrl from "rollup-plugin-import-meta-url";
import ts from "typescript";

const sys = ts.sys;
const cwd = sys.getCurrentDirectory();

const formatDiagnosticsHost = {
  getCurrentDirectory: () => cwd,
  getCanonicalFileName: (fileName) => fileName,
  getNewLine: () => sys.newLine,
};

const cache = Object.create(null);

const host = ts.createWatchCompilerHost(
  "tsconfig.json",
  {
    noEmit: false,
    outDir: false,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
  },
  {
    ...sys,
    writeFile(path, data) {
      cache[path.replace(/\.js(x)?(\.map)?$/, ".ts$1$2")] = data;
    },
  },
  ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  (diagnostic) => {
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));
  },
  (diagnostic, _newLine, _options, errorCount) => {
    sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));

    if (errorCount) {
      process.exitCode = 1;
    }
  },
);

ts.createWatchProgram(host).close();

if (process.exitCode === 1 && process.env.NODE_ENV !== "development") {
  process.exit();
}

export default async () => {
  /** @type {import("rollup").RollupOptions[]} */
  const options = [];
  const external = (id) => /^@?[A-Za-z]/.test(id);

  /** @type {import("rollup").Plugin} */
  const cachePlugin = {
    resolveId(source, importer = "index.ts") {
      const id = resolve(importer, "..", source);

      if (id in cache) {
        return id;
      }

      throw new Error(`Can't resolve ${source}`);
    },
    load(id) {
      if (id in cache) {
        return { code: cache[id], map: cache[id + ".map"] };
      }

      throw new Error(`Could not load '${id}'`);
    },
    renderChunk(code, chunk) {
      if (!chunk.isEntry || chunk.name !== "bin") {
        return null;
      }

      const magicString = new MagicString(code);
      magicString.prepend("#!/usr/bin/env node\n");
      return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) };
    },
  };

  const babelPlugin = (target) => {
    target = target === "client" ? "client" : "server";
    return babel({
      extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"],
      configFile: false,
      babelrc: false,
      babelHelpers: "bundled",
      presets: [
        [
          env,
          {
            bugfixes: true,
            modules: false,
            loose: false,
            ignoreBrowserslistConfig: true,
            targets: {
              node: "14",
              chrome: "83",
            },
            useBuiltIns: false,
          },
        ],
        [typescript],
        [
          react,
          {
            runtime: "automatic",
            importSource: "react",
          },
        ],
      ],
      plugins: [
        [
          _resolve,
          {
            ignoreBuiltins: true,
            ignoreBareImport: true,
            extensions: [
              `.${target}.tsx`,
              `.${target}.ts`,
              `.${target}.jsx`,
              `.${target}.mjs`,
              `.${target}.js`,
              `.${target}.cjs`,
              `.${target}.json`,
              `.tsx`,
              `.ts`,
              `.jsx`,
              `.mjs`,
              `.js`,
              `.cjs`,
              `.json`,
              `.node`,
            ],
          },
        ],
        [subpath],
        [constant],
      ],
    });
  };

  /** @type {import("rollup").Plugin[]} */
  const serverPlugins = [cachePlugin, babelPlugin("server"), importMetaUrl()];
  /** @type {import("rollup").Plugin[]} */
  const clientPlugins = [cachePlugin, babelPlugin("client")];

  const [paths, clients, bins] = await Promise.all(
    ["packages/*/src/index.{ts,tsx}", "packages/*/src/index.client.{ts,tsx}", "packages/*/src/bin.ts"].map((source) =>
      glob(source, { absolute: true }),
    ),
  );

  const binSet = new Set(bins);
  const dtsInput = [];

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");
    const bin = resolve(path, "..", "bin.ts");
    const input = [path];
    dtsInput.push(path);

    if (binSet.has(bin)) {
      input.push(bin);
      binSet.delete(bin);
    }

    options.push({
      input,
      output: [
        {
          dir,
          format: "module",
          sourcemap: true,
          sourcemapExcludeSources: true,
          preferConst: true,
          entryFileNames: "[name].js",
          chunkFileNames: "[name]-[hash].js",
        },
        {
          dir,
          format: "commonjs",
          sourcemap: true,
          sourcemapExcludeSources: true,
          preferConst: true,
          entryFileNames: "[name].cjs",
          chunkFileNames: "[name]-[hash].cjs",
          interop: "auto",
          exports: "named",
        },
      ],
      external,
      plugins: serverPlugins,
    });
  }

  for (const client of clients) {
    const dir = resolve(client, "..", "..", "dist");

    options.push({
      input: client,
      output: {
        dir,
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].client.js",
      },
      external,
      plugins: clientPlugins,
    });
  }

  for (const bin of [...binSet]) {
    const dir = resolve(bin, "..", "..", "dist");

    options.push({
      input: bin,
      output: {
        dir,
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
      external,
      plugins: serverPlugins,
    });
  }

  options.push({
    input: Object.fromEntries(
      dtsInput.map((input) => [relative(cwd, resolve(input, "..", "..", "dist", parse(input).name)), input]),
    ),
    output: {
      dir: cwd,
      format: "module",
    },
    external,
    plugins: [dts()],
  });

  return options;
};
