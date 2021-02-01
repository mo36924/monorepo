import { transformSync, TransformOptions } from "@babel/core";
import { describe, test, expect } from "@jest/globals";
import plugin from "./index";

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [[plugin]],
};

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-dead-code-elimination", () => {
  test("if", () => {
    const result = transform(`
      if(true){
        console.log(true)
      }else{
        console.log(false)
      }
    `);

    expect(result).toMatchInlineSnapshot(`console.log(true);`);
  });

  test("conditional", () => {
    const result = transform(`
      const a = true ? 1 : 2
    `);

    expect(result).toMatchInlineSnapshot(`const a = 1;`);
  });

  test("replace", () => {
    let result = transform(`
      if("test" === "test")
        a = 1
    `);

    expect(result).toMatchInlineSnapshot(`a = 1;`);

    result = transform(`
      if("test" === "development")
        a = 1
    `);

    expect(result).toMatchInlineSnapshot(``);

    result = transform(`
      if("test" === "production"){
        console.log("production")
      }else if("test" === "development"){
        console.log("development")
      }else if("test" === "test"){
        console.log("test")
      }else{
        console.log("unknown")
      }
    `);

    expect(result).toMatchInlineSnapshot(`console.log("test");`);

    result = transform(`
      if("test" === "production"){
        console.log("production")
      }else if("test" === "development"){
        console.log("development")
      }else{
        console.log("unknown")
      }
    `);

    expect(result).toMatchInlineSnapshot(`console.log("unknown");`);

    result = transform(`
      if(a === "production"){
        console.log("production")
      }else if("test" === "test"){
        console.log("test")
      }else{
        console.log("unknown")
      }
    `);

    expect(result).toMatchInlineSnapshot(`
      if (a === "production") {
        console.log("production");
      } else {
        console.log("test");
      }
    `);
  });
});
