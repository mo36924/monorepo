import { readdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import babel from "@babel/core";
import typescript from "@babel/plugin-syntax-typescript";
import glob from "fast-glob";
import prettier from "prettier";

const { parseAsync, traverse, types } = babel;

export default async () => {
  const [pkgJson, paths] = await Promise.all([readFile("package.json", "utf8"), glob("packages/*/package.json")]);

  const devDependencies: { [pkg: string]: string } = Object.assign(
    Object.create(null),
    JSON.parse(pkgJson).devDependencies,
  );

  await Promise.all(
    paths.map(async (path) => {
      const name = basename(dirname(path));

      if (name === "types") {
        return;
      }

      try {
        const pkg: { [key: string]: any } = {
          type: undefined,
          exports: undefined,
          dependencies: undefined,
          devDependencies: undefined,
          peerDependencies: undefined,
        };

        const exports: { [key: string]: any } = {};
        const files = await readdir(join(path, "..", "dist"));

        if (files.includes("index.js")) {
          pkg.main = "./dist/index.js";
          exports.require = "./dist/index.js";
        }

        if (files.includes("index.client.js")) {
          pkg.browser = "./dist/index.client.js";
          exports.browser = "./dist/index.client.js";
        }

        if (files.includes("index.mjs")) {
          pkg.module = "./dist/index.mjs";
          exports.import = "./dist/index.mjs";
        }

        if (files.includes("bin.mjs")) {
          pkg.bin = {
            [name]: "./dist/bin.mjs",
          };
        }

        if (Object.keys(exports).length) {
          pkg.exports = {
            ".": {
              browser: undefined,
              import: undefined,
              require: undefined,
              ...exports,
            },
          };
        }

        const dependencies: { [pkg: string]: string } = Object.create(null);

        await Promise.all(
          files
            .filter((file) => /\.(mjs|d\.ts)$/.test(file))
            .map(async (file) => {
              const filename = resolve(path, "..", "dist", file);
              const code = await readFile(filename, "utf8");
              const ast = await parseAsync(code, { sourceType: "module", plugins: [typescript], filename });

              traverse(ast, {
                ModuleDeclaration({ node }) {
                  if ("source" in node && node.source && devDependencies[node.source.value]) {
                    dependencies[node.source.value] = devDependencies[node.source.value];
                  }
                },
                Import({ parent }) {
                  if (
                    types.isCallExpression(parent) &&
                    types.isStringLiteral(parent.arguments[0]) &&
                    devDependencies[parent.arguments[0].value]
                  ) {
                    dependencies[parent.arguments[0].value] = devDependencies[parent.arguments[0].value];
                  }
                },
              });
            }),
        );

        pkg.dependencies = Object.fromEntries(
          Object.keys(dependencies)
            .sort()
            .map((pkg) => [pkg, dependencies[pkg]]),
        );

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
            types: undefined,
            exports: undefined,
            dependencies: undefined,
            devDependencies: undefined,
            peerDependencies: undefined,
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
    }),
  );
};
