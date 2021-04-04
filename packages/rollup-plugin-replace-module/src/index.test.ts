import { describe, expect, it } from "@jest/globals";
import vfs from "@mo36924/rollup-plugin-vfs";
import { rollup } from "rollup";
import replaceModule from "./index";

describe("rollup-plugin-replace-module", () => {
  it("replace-module", async () => {
    const build = await rollup({
      input: "src/index.js",
      plugins: [vfs({ "src/index.js": `import "test"` }), replaceModule({ test: `console.log("test");` })],
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
