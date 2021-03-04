import { readdir, readFile, writeFile } from "fs/promises";
import { join, dirname, basename } from "path";
import glob from "fast-glob";
import prettier from "prettier";

const paths = await glob("packages/*/package.json");

for (const path of paths) {
  try {
    const pkg = {};
    const exports = {};
    const files = await readdir(join(path, "..", "dist"));

    if (files.includes("index.js")) {
      pkg.main = "./dist/index.js";
    }

    if (files.includes("index.mjs")) {
      pkg.module = "./dist/index.mjs";
    }

    if (files.includes("index.client.js")) {
      pkg.browser = "./dist/index.client.js";
      exports.browser = "./dist/index.client.js";
    }

    if (files.includes("bin.mjs")) {
      pkg.bin = {
        [basename(dirname(path))]: "./dist/bin.mjs",
      };
    }

    if (pkg.module) {
      exports.import = "./dist/index.mjs";
    }

    if (pkg.main) {
      exports.require = "./dist/index.js";
    }

    const formattedCode = prettier.format(
      JSON.stringify({
        name: undefined,
        version: undefined,
        description: undefined,
        keywords: undefined,
        author: undefined,
        license: undefined,
        homepage: undefined,
        bugs: undefined,
        repository: undefined,
        publishConfig: undefined,
        main: undefined,
        module: undefined,
        browser: undefined,
        bin: undefined,
        exports: undefined,
        ...JSON.parse(await readFile(path, "utf8")),
        ...pkg,
        exports: {
          ".": exports,
        },
      }),
      {
        ...(await prettier.resolveConfig(path)),
        filepath: path,
      },
    );

    await writeFile(path, formattedCode);
  } catch {}
}
