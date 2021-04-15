import { readdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import babel from "@babel/core";
import typescript from "@babel/plugin-syntax-typescript";
import prettier from "prettier";

const { parseAsync, traverse, types } = babel;

export default async () => {
  const [packageJson, names, prettierOptions] = await Promise.all([
    readFile("package.json", "utf8"),
    readdir("packages"),
    prettier.resolveConfig("package.json"),
  ]);

  const devDependencies: { [pkg: string]: string } = Object.assign(
    Object.create(null),
    JSON.parse(packageJson).devDependencies,
  );

  const packageJsonPaths = names.map((name) => resolve("packages", name, "package.json"));
  const pkgs: { [packageJsonPath: string]: { [key: string]: any } } = Object.create(null);

  await Promise.all(
    packageJsonPaths.map(async (packageJsonPath) => {
      try {
        const pkg = JSON.parse(await readFile(packageJsonPath, "utf8"));
        pkgs[packageJsonPath] = pkg;
        devDependencies[pkg.name] = `^${pkg.version}`;
      } catch {}
    }),
  );

  await Promise.all(
    Object.entries(pkgs).map(async ([packageJsonPath, pkg]) => {
      const name = basename(dirname(packageJsonPath));

      try {
        pkg = {
          ...pkg,
          type: undefined,
          exports: undefined,
          dependencies: undefined,
          devDependencies: undefined,
          peerDependencies: undefined,
        };

        const exports: { [key: string]: any } = {};
        const files = await readdir(join(packageJsonPath, "..", "dist"));

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
              const filename = resolve(packageJsonPath, "..", "dist", file);
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
            ...pkg,
          }),
          {
            ...prettierOptions,
            filepath: packageJsonPath,
          },
        );

        await writeFile(packageJsonPath, formattedCode);
      } catch (err) {
        console.error(String(err));
      }
    }),
  );
};
