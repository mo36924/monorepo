import { describe, expect, it } from "@jest/globals";
import vfs from "@mo36924/rollup-plugin-vfs";
import nodeResolve from "@rollup/plugin-node-resolve";
import { rollup } from "rollup";
import prebuild from "./index";

describe("rollup-plugin-commonjs-prebuild", () => {
  it("commonjs-prebuild", async () => {
    const build = await rollup({
      input: "src/index.js",
      plugins: [
        vfs({ "src/index.js": `import "readable-stream"` }),
        nodeResolve(),
        prebuild({ packages: ["readable-stream"] }),
      ],
    });

    const { output } = await build.generate({ file: "dist/index.js" });
    const code = output[0].code;
    await build.close();

    expect(code).toBeTruthy();
  });
});
