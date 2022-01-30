import { readdir } from "fs/promises";
import { resolve } from "path";
import depcheck from "depcheck";

export default async (workspaceDir = "packages") => {
  const createMessages = (title: string, names: string[]) =>
    names.length ? [title, ...names.map((name) => `* ${name}`)] : [];

  const names = await readdir(workspaceDir);

  const messages = await Promise.all(
    names
      .filter((name) => name[0] !== ".")
      .map(async (name) => {
        const result = await depcheck(resolve(workspaceDir, name), {
          ignoreDirs: ["dist", "__tests__", "test"],
          ignorePatterns: ["*.test.*", "test"],
        });

        const messages = [];

        messages.push(
          ...createMessages("Unused dependencies", result.dependencies),
          ...createMessages("Unused devDependencies", result.devDependencies),
          ...createMessages("Missing dependencies", Object.keys(result.missing)),
        );

        return messages.length ? [name, ...messages] : [];
      }),
  );

  const message = messages.flat().join("\n");

  console.log(message);
};
