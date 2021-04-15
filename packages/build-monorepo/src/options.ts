import { parse, relative, resolve } from "path";
import glob from "fast-glob";
import type { Plugin, RollupOptions, WarningHandlerWithDefault } from "rollup";
import dts from "rollup-plugin-dts";
import importMetaUrl from "rollup-plugin-import-meta-url";
import babelPlugin from "./babel-plugin";
import cachePlugin from "./cache-plugin";
import warnings from "./warnings";

export default async () => {
  const options: RollupOptions[] = [];
  const external = (id: string) => /^@?[A-Za-z]/.test(id);
  const onwarn: WarningHandlerWithDefault = warnings.add;
  const cache = cachePlugin();
  const serverPlugins: Plugin[] = [cache, babelPlugin("server"), importMetaUrl()];
  const clientPlugins: Plugin[] = [cache, babelPlugin("client")];
  const cwd = process.cwd();

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
      onwarn,
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
      onwarn,
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
      onwarn,
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
    onwarn,
    plugins: [dts()],
  });

  return options;
};
