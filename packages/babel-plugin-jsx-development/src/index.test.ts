import { transformSync } from "@babel/core";
import { describe, expect, test } from "@jest/globals";
import plugin from "./index";

const options = {
  babelrc: false,
  configFile: false,
  filename: "index.jsx",
  presets: [["@babel/preset-react", { runtime: "automatic", importSource: "preact" }]],
  plugins: [[plugin]],
};

const transform = (code: string) => transformSync(code, options);

describe("babel-plugin-jsx-development", () => {
  test("", () => {
    const result = transform("export default () => <div />");

    expect(result).toMatchInlineSnapshot(`
      import "@mo36924/react-refresh-runtime";
      import { jsx as _jsx } from "preact/jsx-runtime";

      const Index = function () {
        return _jsx("div", {});
      };

      Index.displayName ??= "Index";
      Index.url ??= import.meta.url;
      export default Index;
    `);
  });
});
