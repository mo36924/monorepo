import { readFile } from "fs/promises";
import { describe, expect, it } from "@jest/globals";
import { checker, getEffectiveCallArguments } from "./index";

describe("typescript-patch", () => {
  it("patch", async () => {
    const code = await readFile("node_modules/typescript/lib/tsserver.js", "utf8");
    expect(code.split(checker).length).toEqual(2);
    expect(code.split(getEffectiveCallArguments).length).toEqual(2);
  });
});
