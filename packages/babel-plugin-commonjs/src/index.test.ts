import { transformSync } from "@babel/core";
import { describe, test, expect } from "@jest/globals";
import plugin from "./index";

const transform = (code: string) =>
  transformSync(code, {
    babelrc: false,
    configFile: false,
    sourceType: "module",
    filename: "index.js",
    plugins: [[plugin]],
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
});
