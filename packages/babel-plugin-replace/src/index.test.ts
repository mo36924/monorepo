import { TransformOptions, transformAsync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import babelPluginReplace from "./index";

const env = `process.env.NODE_EN${"V"}`;

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [
    [
      babelPluginReplace,
      {
        "process.env.NODE_ENV": true,
        "typeof window": JSON.stringify("object"),
        __VALUE__: JSON.stringify("value"),
      },
    ],
  ],
};

const transform = (code: string) => transformAsync(code, options).then((result) => result?.code ?? "");

describe("babel-plugin-replace", () => {
  test("NODE_ENV", async () => {
    let code = await transform(`
      if(process.env.NODE_ENV === "production"){
        console.log(process.env.NODE_ENV)
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      "if (true === \\"production\\") {
        console.log(true);
      }"
    `);

    code = await transform(`
      if("process.env.NODE_ENV" === "production"){
        console.log("process.env.NODE_ENV")
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      "if (\\"process.env.NODE_ENV\\" === \\"production\\") {
        console.log(\\"process.env.NODE_ENV\\");
      }"
    `);
  });

  test("typeof", async () => {
    const code = await transform(`
      if(typeof window === "undefined"){
        console.log("")
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      "if (\\"object\\" === \\"undefined\\") {
        console.log(\\"\\");
      }"
    `);
  });

  test("global value", async () => {
    const code = await transform(`
      if(__VALUE__){
        console.log(__VALUE__)
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      "if (\\"value\\") {
        console.log(\\"value\\");
      }"
    `);
  });
});
