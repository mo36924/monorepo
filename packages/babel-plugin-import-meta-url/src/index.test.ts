import { TransformOptions, transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin from "./index";

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [[plugin]],
};

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-import-meta-url", () => {
  test("import.meta.url", () => {
    const result = transform("export default () => import.meta.url;");
    expect(result).toMatchInlineSnapshot(`export default () => require("url").pathToFileURL(__filename).href;`);
  });
});
