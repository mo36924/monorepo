import { parse, relative, resolve } from "path";
import constant from "@babel/plugin-transform-react-constant-elements";
import env, { Options as envOptions } from "@babel/preset-env";
import react from "@babel/preset-react";
import babelTypescript from "@babel/preset-typescript";
import babelResolve, { Options as babelResolveOptions } from "@mo36924/babel-plugin-resolve";
import subpath from "@mo36924/babel-plugin-resolve-subpath";
import importMetaUrl from "@mo36924/rollup-plugin-import-meta-url";
import shebang from "@mo36924/rollup-plugin-shebang";
import { babel } from "@rollup/plugin-babel";
import rollupTypescript from "@rollup/plugin-typescript";
import glob from "fast-glob";
import type { RollupOptions } from "rollup";
import dts from "rollup-plugin-dts";

const rollupTypescriptPlugin = rollupTypescript({
  declaration: false,
  outDir: undefined,
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
});

const options: RollupOptions[] = [];
const cwd = process.cwd();
const external = (id: string) => /^@?[A-Za-z]/.test(id);
const serverPlugins = getPlugins("server");
const clientPlugins = getPlugins("client");

const [paths, clients, bins] = await Promise.all(
  ["packages/*/src/index.{ts,tsx}", "packages/*/src/index.client.{ts,tsx}", "packages/*/src/bin.ts"].map((source) =>
    glob(source, { absolute: true }),
  ),
);

const binSet = new Set(bins);
const dtsInput: string[] = [];

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
        entryFileNames: "[name].mjs",
        chunkFileNames: "[name]-[hash].mjs",
      },
      {
        dir,
        format: "commonjs",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
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
      entryFileNames: "[name].mjs",
      chunkFileNames: "[name]-[hash].mjs",
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

function getPlugins(target: "server" | "client"): NonNullable<RollupOptions["plugins"]> {
  target = target === "server" ? "server" : "client";
  return [
    rollupTypescriptPlugin,
    babel({
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
              chrome: "88",
            },
            useBuiltIns: false,
          } as envOptions,
        ],
        [babelTypescript],
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
          babelResolve,
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
          } as babelResolveOptions,
        ],
        [subpath],
        [constant],
      ],
    }),
    target === "server" && importMetaUrl(),
    target === "server" && shebang({ include: "packages/*/src/bin.ts", prepend: true }),
  ];
}

export default options;
