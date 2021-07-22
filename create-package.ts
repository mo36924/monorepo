import { mkdir, readFile } from "fs/promises";
import { join } from "path";
import { writeFile } from "@mo36924/util-node";
import sortPackageJson from "sort-package-json";
import validate from "validate-npm-package-name";

const name = process.argv[2]?.trim() ?? "";
const { validForNewPackages, validForOldPackages, errors, warnings } = validate(`@scope/${name}`);

if (!(validForNewPackages && validForOldPackages)) {
  throw new Error(`Invalid name: ${(errors ?? warnings ?? []).join()}`);
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

pkg = {
  version: "1.0.0",
  description: name,
  keywords: [],
  license: "MIT",
  ...pkg,
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

await Promise.allSettled([
  writeFile(join(dir, "package.json"), JSON.stringify(sortPackageJson(pkg))),
  writeFile(join(dir, "README.md"), `# ${name}\n\n${name}\n`, { overwrite: false }),
]);
