import { resolve } from "path";
import typescript from "@rollup/plugin-typescript";
import glob from "fast-glob";
import dts from "rollup-plugin-dts";

export default async () => {
  /** @type {import("rollup").RollupOptions[]} */
  const options = [];
  let paths = await glob("packages/*/src/index.{ts,tsx}");

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
        external: (id) => /^@?[A-Za-z]/.test(id),
        plugins: [typescript()],
      },
      {
        input: path,
        output: {
          file: resolve(dir, "index.d.ts"),
          format: "module",
        },
        plugins: [dts()],
      },
    );
  }

  paths = await glob("packages/*/src/index.browser.{ts,tsx}");

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");

    options.push({
      input: path,
      output: {
        file: resolve(dir, "index.browser.js"),
        format: "module",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
      },
      external: (id) => /^@?[A-Za-z]/.test(id),
      plugins: [typescript()],
    });
  }

  paths = await glob("packages/*/src/bin.ts");

  for (const path of paths) {
    const dir = resolve(path, "..", "..", "dist");

    options.push({
      input: path,
      output: {
        file: resolve(dir, "bin.js"),
        format: "commonjs",
        sourcemap: true,
        sourcemapExcludeSources: true,
        preferConst: true,
      },
      external: (id) => /^@?[A-Za-z]/.test(id),
      plugins: [typescript()],
    });
  }

  return options;
};
