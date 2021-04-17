import { readFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import { describe, expect, it } from "@jest/globals";
import {
  checker,
  getEffectiveCallArguments,
  getEffectiveCallArgumentsWithComment,
  typescriptNames,
  typescriptNamespace,
} from "./constants";

describe("typescript-patch", () => {
  it("constants", async () => {
    const _require = createRequire(import.meta.url);
    const basePath = _require.resolve("typescript");

    for (const typescriptName of typescriptNames) {
      const typescriptPath = join(basePath, "..", typescriptName);
      const code = await readFile(typescriptPath, "utf8");
      expect(code.includes(typescriptNamespace)).toBeTruthy();
      expect(code.split(checker).length).toEqual(2);

      expect(
        code.split(
          code.includes(getEffectiveCallArguments) ? getEffectiveCallArguments : getEffectiveCallArgumentsWithComment,
        ).length,
      ).toEqual(2);
    }
  });
});
