import { transformSync, TransformOptions } from "@babel/core";
import { describe, test, expect } from "@jest/globals";
import plugin from "./index";

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [[plugin]],
};

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-iife-unwrap", () => {
  test("iife", () => {
    const result = transform("(function(){var a = 1})()");
    expect(result).toMatchInlineSnapshot(`var a = 1;`);
  });

  test("iife unary expression", () => {
    const result = transform("!function(){var a = 1}()");
    expect(result).toMatchInlineSnapshot(`var a = 1;`);
  });

  test("iife arrow function", () => {
    const result = transform("(() => {var a = 1})()");
    expect(result).toMatchInlineSnapshot(`var a = 1;`);
  });
});
