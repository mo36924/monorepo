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

describe("babel-preset-lib", () => {
  test("ignoreBuiltins", () => {
    const result = transform(`import babel from "fs"`);
    expect(result).toMatchInlineSnapshot(`import babel from "fs";`);
  });

  test("ignoreBareImport", () => {
    const result = transform(`import babel from "@babel/core"`);
    expect(result).toMatchInlineSnapshot(`import babel from "@babel/core";`);
  });

  test("resolve dir", () => {
    const result = transform(`import babel from "./packages/babel-preset-lib/src"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/babel-preset-lib/src/index.ts";`);
  });

  test("resolve extension", () => {
    const result = transform(`import babel from "./packages/babel-preset-lib/src/index"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/babel-preset-lib/src/index.ts";`);
  });

  test("resolve dir", () => {
    const result = transform(`import babel from "./packages/babel-preset-lib/src"`);
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/babel-preset-lib/src/index.ts";`);
  });

  test("resolve server file", () => {
    const result = transform(`import babel from "./packages/graphql-client/src/index"`, { target: "server" });
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/graphql-client/src/index.ts";`);
  });

  test("resolve client file", () => {
    const result = transform(`import babel from "./packages/graphql-client/src/index"`, { target: "client" });
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/graphql-client/src/index.client.ts";`);
  });

  test("resolve server dir", () => {
    const result = transform(`import babel from "./packages/graphql-client/src"`, { target: "server" });
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/graphql-client/src/index.ts";`);
  });

  test("resolve client dir", () => {
    const result = transform(`import babel from "./packages/graphql-client/src"`, { target: "client" });
    expect(result).toMatchInlineSnapshot(`import babel from "./packages/graphql-client/src/index.client.ts";`);
  });
});
