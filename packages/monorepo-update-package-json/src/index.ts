import { readFile, readdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import depcheck from "depcheck";
import prettier from "prettier";
import sort from "sort-package-json";

export default async () => {
  const dir = resolve("packages");

  const [pkg, pkgs, config] = await Promise.all([
    readFile("package.json", "utf8").then(JSON.parse),
    readdir(dir).then((names) =>
      Promise.all(
        names
          .filter((name) => name[0] !== ".")
          .map((name) =>
            Promise.all([
              name,
              readFile(join(dir, name, "package.json"), "utf8").then(JSON.parse),
              depcheck(join(dir, name), {
                ignoreDirs: ["dist", "__tests__", "test"],
                ignorePatterns: ["*.test.*", "test"],
              }),
            ]),
          ),
      ),
    ),
    prettier.resolveConfig("package.json"),
  ]);

  const deps = Object.assign(
    Object.create(null),
    pkg.devDependencies,
    Object.fromEntries(
      pkgs.filter(([, pkg]) => pkg.name && pkg.version).map(([, pkg]) => [pkg.name, `^${pkg.version}`]),
    ),
  );

  const _deps = (obj: any) => (Object.keys(obj).length ? obj : undefined);

  await Promise.all(
    pkgs.map(([name, _pkg, result]) =>
      writeFile(
        join(dir, name, "package.json"),
        prettier.format(
          JSON.stringify(
            sort({
              version: "0.0.1",
              description: name,
              keywords: [],
              license: "MIT",
              name: `@${pkg.author}/${name}`,
              author: pkg.author,
              homepage: pkg.homepage ?? `https://github.com/${pkg.author}/${pkg.name}#readme`,
              bugs: {
                url: pkg.bugs?.url ?? `https://github.com/${pkg.author}/${pkg.name}/issues`,
              },
              repository: {
                type: pkg.repository?.type ?? "git",
                url: pkg.repository?.url ?? `git+https://github.com/${pkg.author}/${pkg.name}.git`,
                directory: pkg.repository?.directory ?? `packages/${name}`,
              },
              main: "./dist/index.cjs",
              module: "./dist/index.mjs",
              types: "./dist/index.d.ts",
              publishConfig: {
                access: "public",
              },
              ..._pkg,
              typesVersions: { "*": { "*": ["dist/*.d.ts", "*"] } },
              files: ["dist"],
              exports: Object.fromEntries(
                Object.keys(_pkg.exports ?? { ".": {} }).map((key) => {
                  const name = key.slice(2) || "index";
                  return [
                    key,
                    {
                      types: `./dist/${name}.d.ts`,
                      browser: `./dist/${name}.js`,
                      import: `./dist/${name}.mjs`,
                      require: `./dist/${name}.cjs`,
                      default: `./dist/${name}.cjs`,
                    },
                  ];
                }),
              ),
              dependencies: _deps({
                ..._pkg.dependencies,
                ...Object.fromEntries(
                  Object.keys(result.using)
                    .map((name) => `@types/${name.replace("@", "").replace("/", "__")}`)
                    .map((name) => [name, deps[name]]),
                ),
                ...Object.fromEntries(Object.keys(result.using).map((name) => [name, deps[name]])),
              }),
            }),
          ),
          { ...config, filepath: "package.json" },
        ),
      ),
    ),
  );
};
