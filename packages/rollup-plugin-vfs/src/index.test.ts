import { describe, expect, it } from "@jest/globals";
import { rollup } from "rollup";
import vfs from "./index";

describe("rollup-plugin-vfs", () => {
  it("vfs", async () => {
    const build = await rollup({
      input: "src/index.js",
      plugins: [vfs({ "src/index.js": `console.log("test");` })],
    });

    const { output } = await build.generate({ file: "dist/index.js" });
    const code = output[0].code;
    await build.close();

    expect(code).toMatchInlineSnapshot(`
      "console.log(\\"test\\");
      "
    `);
  });
});
