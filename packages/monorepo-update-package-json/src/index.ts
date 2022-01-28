import { readdir, readFile, writeFile } from "fs/promises";

const workspaceDir = "packages";

export default async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const names = await readdir(workspaceDir);

  await Promise.all(
    names
      .filter((name) => name[0] !== ".")
      .map(async (name) => {
        const path = `${workspaceDir}/${name}/package.json`;
        let _pkg: { [name: string]: any } = JSON.parse(await readFile(path, "utf8"));
        const { exports = { ".": {} } } = _pkg;

        for (const key of Object.keys(exports)) {
          const name = key.slice(2) || "index";

          exports[key] = {
            types: `./dist/${name}.d.ts`,
            browser: `./dist/${name}.js`,
            import: `./dist/${name}.mjs`,
            require: `./dist/${name}.cjs`,
            default: `./dist/${name}.cjs`,
          };
        }

        _pkg = {
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
          publishConfig: {
            access: "public",
          },
          ..._pkg,
          main: "./index.cjs",
          module: "./index.mjs",
          exports,
          typesVersions: { "*": { "*": ["dist/*.d.ts"] } },
        };

        await writeFile(path, JSON.stringify(_pkg));
      }),
  );
};
