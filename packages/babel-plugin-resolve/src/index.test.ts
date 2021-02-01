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

describe("babel-plugin-resolve", () => {
  test("bare import", () => {
    const result = transform(`import babel from "@babel/core"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./node_modules/@babel/core/lib/index.js";`);
  });

  test("builtin module", () => {
    const result = transform(`import path from "buffer"`, { ignoreBuiltins: true });
    expect(result).toMatchInlineSnapshot(`import path from "buffer";`);
  });

  test("export", async () => {
    const result = await transform(`export { createElement } from "@babel/core"`);
    expect(result).toMatchInlineSnapshot(`export { createElement } from "./node_modules/@babel/core/lib/index.js";`);
  });

  test("paths", () => {
    const result = transform(`export { createElement } from "~/babel-plugin-resolve/src"`, {
      paths: { "~/": "./packages/" },
    });

    expect(result).toMatchInlineSnapshot(
      `export { createElement } from "./packages/babel-plugin-resolve/src/index.ts";`,
    );
  });

  test("pathRegexps", () => {
    const result = transform(`export { createElement } from "~/babel-plugin-resolve"`, {
      pathRegexps: { "^~/([^/]+)/?": "./packages/$1/src/" },
    });

    expect(result).toMatchInlineSnapshot(
      `export { createElement } from "./packages/babel-plugin-resolve/src/index.ts";`,
    );
  });
});
