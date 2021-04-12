import { readFile } from "fs/promises";
import { describe, expect, it } from "@jest/globals";

describe("typescript-patch", () => {
  it("patch", async () => {
    const checker = `
    var checker = {
`;

    const getEffectiveCallArguments = `
    function getEffectiveCallArguments(node) {
        if (node.kind === 205) {
`;

    const code = await readFile("node_modules/typescript/lib/tsserver.js", "utf8");
    expect(code.split(checker).length).toEqual(1);
    expect(code.split(getEffectiveCallArguments).length).toEqual(1);
  });
});
