import { expect, test } from "@jest/globals";
import { camelCase } from "change-case";
import postcss from "postcss";
import pluginFactory from "./index";

test("postcss-modules", async () => {
  let mod = "";

  const plugin = pluginFactory({
    renameId: (value) => `id_${value}`,
    renameClass: (value) => `class_${value}`,
    write: (result) => {
      const code =
        "export {};\n" +
        Object.entries(result.ids)
          .map(([id, renamedId]) => `export const $${camelCase(id)} = ${JSON.stringify(renamedId)};\n`)
          .join("") +
        Object.entries(result.classes)
          .map(
            ([className, renamedClassName]) =>
              `export const _${camelCase(className)} = ${JSON.stringify(renamedClassName)};\n`,
          )
          .join("");

      mod = code;
    },
  });

  const css = `
    #a {
      display: block;
    }
    .b {
      display: inline;
    }
  `;

  const { css: _css } = postcss(plugin).process(css);

  expect(_css).toMatchInlineSnapshot(`
    "
        #id_a {
          display: block;
        }
        .class_b {
          display: inline;
        }
      "
  `);

  expect(mod).toMatchInlineSnapshot(`
    "export {};
    export const $a = \\"id_a\\";
    export const _b = \\"class_b\\";
    "
  `);
});
