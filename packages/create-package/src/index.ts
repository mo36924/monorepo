import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { format, resolveConfig } from "@mo36924/prettier";

async function write(path: string, code: string, overwrite: boolean) {
  const config = await resolveConfig(path);

  await writeFile(path, format(code, { ...config, filepath: path }), {
    flag: overwrite ? "w" : "wx",
  });
}

export default async () => {
  const name = process.argv[2]?.trim();

  if (!name || /[^\w\-]/.test(name)) {
    return;
  }

  let base: { [key: string]: any } = {};

  try {
    base = JSON.parse(await readFile("package.json", "utf8"));
  } catch {}

  const dir = join("packages", name);
  await mkdir(join(dir, "src"), { recursive: true });
  let pkg: { [key: string]: any } = {};

  try {
    pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
  } catch {}

  const _pkg: { [key: string]: any } = {
    name: `${base.name?.split("/")[0] || "@mo36924"}/${name}`,
    author: base.author ?? "mo36924 <mo36924@users.noreply.github.com>",
    homepage: base.homepage ?? "https://github.com/mo36924/monorepo#readme",
    bugs: base.bugs ?? {
      url: "https://github.com/mo36924/monorepo/issues",
    },
    repository: {
      type: base.repository?.type ?? "git",
      url: base.repository?.url ?? "git+https://github.com/mo36924/monorepo.git",
      directory: `packages/${name}`,
    },
    publishConfig: {
      access: "public",
    },
  };

  pkg = {
    name: undefined,
    version: "1.0.0",
    description: name,
    keywords: [],
    author: undefined,
    license: "MIT",
    homepage: undefined,
    bugs: undefined,
    repository: undefined,
    publishConfig: undefined,
    main: undefined,
    module: undefined,
    browser: undefined,
    bin: undefined,
    exports: undefined,
    scripts: undefined,
    prettier: undefined,
    eslintConfig: undefined,
    jest: undefined,
    dependencies: undefined,
    devDependencies: undefined,
    peerDependencies: undefined,
    optionalDependencies: undefined,
    ...pkg,
    ..._pkg,
  };

  await Promise.allSettled([
    write(join(dir, "package.json"), JSON.stringify(pkg, null, 2), true),
    write(join(dir, "README.md"), `# ${name}\n\n${name}\n`, false),
  ]);
};
