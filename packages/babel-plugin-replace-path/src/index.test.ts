import { resolve } from "path";
import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin, { Options } from "./index";

const transform = (
  code: string,
  options: Options = { baseUrl: ".", paths: { "~/": "src/" }, pathRegexps: { "\\.module$": "$&.ts" } },
) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename: resolve("index.mjs"),
    plugins: [[plugin, options]],
  });

describe("babel-plugin-replace-path", () => {
  test("replace-path", () => {
    const result = transform(`import babel from "~/hoge"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./src/hoge";`);
  });

  test("replace-extension", () => {
    const result = transform(`import babel from "~/hoge.module"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./src/hoge.module.ts";`);
  });
});
