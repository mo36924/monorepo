import { readFile } from "fs/promises";
import { describe, expect, it } from "@jest/globals";
import {
  checker,
  files,
  getEffectiveCallArguments,
  getEffectiveCallArgumentsWithComment,
  typescriptNamespace,
} from "./index";

describe("typescript-patch", () => {
  it("patch", async () => {
    for (const file of files) {
      const code = await readFile(file, "utf8");
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
