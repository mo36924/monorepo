import { resolve } from "path";
import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import preset, { Options } from "./index";

const transform = (code: string, options: Options = {}) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename: resolve("index.mjs"),
    presets: [[preset, options]],
  });

describe("babel-preset-app", () => {
  test("app", () => {
    const result = transform(`import babel from "@babel/core"`, { target: "client" });
    expect(result).toMatchInlineSnapshot(`import babel from "./node_modules/@babel/core/lib/index.js";`);
  });
});
