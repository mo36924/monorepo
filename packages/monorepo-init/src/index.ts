import { mkdir, writeFile } from "fs/promises";
import update from "@mo36924/monorepo-update-package-json";

const workspaceDir = "packages";

export default async (name: string) => {
  if (name == null || !/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid name: ${name}`);
  }

  await mkdir(`${workspaceDir}/${name}/src`, { recursive: true });

  await Promise.allSettled([
    writeFile(`${workspaceDir}/${name}/package.json`, "{}", { flag: "wx" }),
    writeFile(`${workspaceDir}/${name}/README.md`, `# ${name}\n\n${name}\n`, { flag: "wx" }),
  ]);

  await update();
};
