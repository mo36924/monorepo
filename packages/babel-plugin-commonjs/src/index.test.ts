import { createRequire } from "module";
import { resolve } from "path";
import { TransformOptions, transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin, { Options } from "./index";

const transform = (code: string, opts: TransformOptions = {}) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    sourceType: "module",
    filename: "index.js",
    plugins: [[plugin, { typescript: ["sys"] } as Options]],
    ...opts,
  });

describe("babel-plugin-commonjs", () => {
  test("module", () => {
    const code = transform(`
      const typescript = require("typescript");
      module.exports = typescript;
    `);

    expect(code).toMatchInlineSnapshot(`
      import typescript from "typescript";
      export default typescript;
    `);
  });

  test("exports", () => {
    const code = transform(`
      const typescript = require("typescript");
      exports.typescript = typescript;
    `);

    expect(code).toMatchInlineSnapshot(`
      const exports = {};
      import typescript from "typescript";
      exports.typescript = typescript;
      export default exports;
    `);
  });

  test("if", () => {
    const code = transform(`
      'use strict';

      if (process.env.NODE_ENV === 'production') {
        module.exports = require('./cjs/typescript.production.min.js');
      } else {
        module.exports = require('./cjs/typescript.development.js');
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      const module = {
        exports: {},
      };
      import _cjsTypescriptProductionMinJs from "./cjs/typescript.production.min.js";
      import _cjsTypescriptDevelopmentJs from "./cjs/typescript.development.js";

      if (process.env.NODE_ENV === "production") {
        module.exports = _cjsTypescriptProductionMinJs;
      } else {
        module.exports = _cjsTypescriptDevelopmentJs;
      }

      export default module.exports;
    `);
  });

  test("named export", () => {
    const _require = createRequire(resolve("index.js"));
    const typescript = _require.resolve("typescript");

    const code = transform(`Object.assign(module.exports, {createElement: () => {}});`, { filename: typescript });

    expect(code).toMatchInlineSnapshot(`
      const module = {
        exports: {},
      };
      Object.assign(module.exports, {
        createElement: () => {},
      });
      export default module.exports;
      export const { sys } = module.exports;
    `);
  });
});
