import { resolve } from "path";
import typescript from "@rollup/plugin-typescript";
import glob from "fast-glob";
import dts from "rollup-plugin-dts";

export default async () => {
  /** @type {import("rollup").RollupOptions[]} */
  const options = [];
  const external = (id) => /^@?[A-Za-z]/.test(id);

  const [paths, clients, bins] = await Promise.all([
    glob("packages/*/src/index.{ts,tsx}"),
    glob("packages/*/src/index.client.{ts,tsx}"),
    glob("packages/*/src/bin.ts"),
  ]);

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");

    options.push(
      {
        input: path,
        output: [
          {
            file: resolve(dir, "index.js"),
            format: "commonjs",
            sourcemap: true,
            sourcemapExcludeSources: true,
            preferConst: true,
            exports: "auto",
          },
          {
            file: resolve(dir, "index.mjs"),
            format: "module",
            sourcemap: true,
            sourcemapExcludeSources: true,
            preferConst: true,
          },
        ],
        external,
        plugins: [typescript()],
      },
      {
        input: path,
        output: {
          file: resolve(dir, "index.d.ts"),
          format: "module",
        },
        external,
        plugins: [dts()],
      },
    );
  }

  for (const client of clients) {
    const dir = resolve(client, "..", "..", "dist");

    options.push({
      input: client,
      output: {
        file: resolve(dir, "index.client.js"),
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
      },
      external,
      plugins: [typescript()],
    });
  }

  for (const bin of bins) {
    const dir = resolve(bin, "..", "..", "dist");

    options.push({
      input: bin,
      output: {
        file: resolve(dir, "bin.js"),
        format: "commonjs",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
      },
      external,
      plugins: [typescript()],
    });
  }

  return options;
};
