import { resolve } from "path";
import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin, { Options } from "./index";

const transform = (code: string, options: Options = {}) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    filename: resolve("index.mjs"),
    plugins: [[plugin, options]],
  });

describe("babel-plugin-resolve-subpath", () => {
  test("subpath module", () => {
    const result = transform(`import execute from "graphql/execution/execute"`);
    expect(result).toMatchInlineSnapshot(`import execute from "graphql/execution/execute.mjs";`);
  });

  test("builtin module", () => {
    const result = transform(`import fs from "fs/promises"`);
    expect(result).toMatchInlineSnapshot(`import fs from "fs/promises";`);
  });

  test("base", () => {
    const result = transform(`import fs from "hoge"`);
    expect(result).toMatchInlineSnapshot(`import fs from "hoge";`);
  });

  test("relative", () => {
    const result = transform(`import rollup from "./rollup.config"`);
    expect(result).toMatchInlineSnapshot(`import rollup from "./rollup.config";`);
  });
});
