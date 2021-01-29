import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import prettier from "prettier";

const name = process.argv[2].trim();
const dir = join("packages", name);
await mkdir(join(dir, "src"), { recursive: true });
let pkg = {};

try {
  pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
} catch {}

pkg = {
  name: undefined,
  version: "1.0.10",
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
  name: `@mo36924/${name}`,
  author: "mo36924 <mo36924@users.noreply.github.com>",
  homepage: "https://github.com/mo36924/monorepo#readme",
  bugs: {
    url: "https://github.com/mo36924/monorepo/issues",
  },
  repository: {
    type: "git",
    url: "git+https://github.com/mo36924/monorepo.git",
    directory: `packages/${name}`,
  },
  publishConfig: {
    access: "public",
  },
};

await Promise.allSettled([
  write(join(dir, "package.json"), JSON.stringify(pkg, null, 2), true),
  write(join(dir, "README.md"), `# ${name}\n\n${name}\n`, {
    flag: "wx",
  }),
]);

async function write(path, code, overwrite) {
  const config = await prettier.resolveConfig(path);

  await writeFile(path, prettier.format(code, { ...config, filepath: path }), {
    flag: overwrite ? "w" : "wx",
  });
}
