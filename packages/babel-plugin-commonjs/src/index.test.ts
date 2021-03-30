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
    plugins: [[plugin, { react: ["createElement"] } as Options]],
    ...opts,
  });

describe("babel-plugin-commonjs", () => {
  test("module", () => {
    const code = transform(`
      const react = require("react");
      module.exports = react;
    `);

    expect(code).toMatchInlineSnapshot(`
      import react from "react";
      export default react;
    `);
  });

  test("exports", () => {
    const code = transform(`
      const react = require("react");
      exports.react = react;
    `);

    expect(code).toMatchInlineSnapshot(`
      const exports = {};
      import react from "react";
      exports.react = react;
      export default exports;
    `);
  });

  test("if", () => {
    const code = transform(`
      'use strict';

      if (process.env.NODE_ENV === 'production') {
        module.exports = require('./cjs/react.production.min.js');
      } else {
        module.exports = require('./cjs/react.development.js');
      }
    `);

    expect(code).toMatchInlineSnapshot(`
      const module = {
        exports: {},
      };
      import _cjsReactProductionMinJs from "./cjs/react.production.min.js";
      import _cjsReactDevelopmentJs from "./cjs/react.development.js";

      if (process.env.NODE_ENV === "production") {
        module.exports = _cjsReactProductionMinJs;
      } else {
        module.exports = _cjsReactDevelopmentJs;
      }

      export default module.exports;
    `);
  });

  test("named export", () => {
    const _require = createRequire(resolve("index.js"));
    const react = _require.resolve("react");

    const code = transform(`Object.assign(module.exports, {createElement: () => {}});`, { filename: react });

    expect(code).toMatchInlineSnapshot(`
      const module = {
        exports: {},
      };
      Object.assign(module.exports, {
        createElement: () => {},
      });
      export default module.exports;
      export const { createElement } = module.exports;
    `);
  });
});
