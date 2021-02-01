import { transformSync, TransformOptions } from "@babel/core";
import { describe, test, expect } from "@jest/globals";
import plugin from "./index";

const options: TransformOptions = {
  babelrc: false,
  configFile: false,
  plugins: [
    [
      plugin,
      {
        Promise: ["promise-polyfill"],
        fetch: ["whatwg-fetch", "fetch"],
        _Headers: ["whatwg-fetch", "Headers"],
      },
    ],
  ],
};

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-inject", () => {
  test("inject module", () => {
    const result = transform(`
      Promise.resolve(true)
      fetch("/url").then(res => console.log(res))
      console.log(_Headers);
    `);

    expect(result).toMatchInlineSnapshot(`
      import "promise-polyfill";
      import { fetch } from "whatwg-fetch";
      import { Headers as _Headers } from "whatwg-fetch";
      Promise.resolve(true);
      fetch("/url").then((res) => console.log(res));
      console.log(_Headers);
    `);
  });

  test("import", () => {
    const result = transform(`
      import { fetch } from "node-fetch"
    `);

    expect(result).toMatchInlineSnapshot(`import { fetch } from "node-fetch";`);
  });

  test("export", () => {
    const result = transform(`
      export { fetch } from "node-fetch"
    `);

    expect(result).toMatchInlineSnapshot(`export { fetch } from "node-fetch";`);
  });

  test("import export", () => {
    const result = transform(`
      import { fetch } from "node-fetch"
      export { fetch }
    `);

    expect(result).toMatchInlineSnapshot(`
      import { fetch } from "node-fetch";
      export { fetch };
    `);
  });
});
