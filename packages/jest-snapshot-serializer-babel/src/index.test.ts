import { transformSync } from "@babel/core";
import { test, expect, describe } from "@jest/globals";
import { test as serializerTest, serialize } from "./index";

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
