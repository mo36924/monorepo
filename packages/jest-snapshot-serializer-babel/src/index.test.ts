import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import { serialize, test as serializerTest } from "./index";

describe("jest-snapshot-serializer-babel", () => {
  test("test", () => {
    const result = transformSync("", { babelrc: false, configFile: false });
    expect(serializerTest(result)).toBeTruthy();
  });

  test("serialize", () => {
    const result = transformSync("var a={},b={}", { babelrc: false, configFile: false })!;

    expect(result.code).toMatchInlineSnapshot(`
      "var a = {},
          b = {};"
    `);

    expect(serialize(result)).toMatchInlineSnapshot(`
      "var a = {},
        b = {};"
    `);
  });
});
