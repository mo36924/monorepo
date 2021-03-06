import { readdir, readFile, writeFile } from "fs/promises";
import { join, dirname, basename } from "path";
import glob from "fast-glob";
import prettier from "prettier";

export default async () => {
  const paths = await glob("packages/*/package.json");

  for (const path of paths) {
    try {
      const pkg: { [key: string]: any } = { type: "module", exports: undefined };
      const exports: { [key: string]: any } = {};
      const files = await readdir(join(path, "..", "dist"));

      if (files.includes("index.js")) {
        pkg.main = "./dist/index.js";
        pkg.module = "./dist/index.js";
        exports.import = "./dist/index.js";
      }

      if (files.includes("index.client.js")) {
        pkg.browser = "./dist/index.client.js";
        exports.browser = "./dist/index.client.js";
      }

      if (files.includes("bin.js")) {
        pkg.bin = {
          [basename(dirname(path))]: "./dist/bin.js",
        };
      }

      if (Object.keys(exports).length) {
        pkg.exports = {
          ".": {
            browser: undefined,
            import: undefined,
            ...exports,
          },
        };
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
          type: undefined,
          main: undefined,
          module: undefined,
          browser: undefined,
          bin: undefined,
          exports: undefined,
          ...JSON.parse(await readFile(path, "utf8")),
          ...pkg,
        }),
        {
          ...(await prettier.resolveConfig(path)),
          filepath: path,
        },
      );

      await writeFile(path, formattedCode);
    } catch (err) {
      console.error(String(err));
    }
  }
};
