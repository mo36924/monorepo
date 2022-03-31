import { readFile } from "fs/promises";
import { parseAsync, types as t, traverse } from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";
import typescript from "@babel/plugin-syntax-typescript";
import glob from "fast-glob";

export type Options = {
  include: string | string[];
  exclude: string | string[];
  tag?: string;
  class?: string;
  codepoints:
    | string[]
    | {
        [ligature: string]: string;
      };
};

export default async (options: Options) => {
  const tag = options.tag;
  const _class = "class" in options ? options.class : "material-icons";

  const codepointSet = new Set(
    Array.isArray(options.codepoints) ? options.codepoints : Object.values(options.codepoints),
  );

  const codepoints = Array.isArray(options.codepoints)
    ? (Object.create(null) as {
        [ligature: string]: string;
      })
    : options.codepoints;

  const paths = await glob(options.include, {
    absolute: true,
    ignore: typeof options.exclude === "string" ? [options.exclude] : options.exclude,
  });

  const collectedCodepointSet = new Set<string>();

  await Promise.all(
    paths.map(async (path) => {
      const data = await readFile(path, "utf-8");
      const result = await parseAsync(data, { plugins: [[typescript, { isTSX: true }], jsx] });

      traverse(result, {
        JSXElement({
          node: {
            openingElement: { name, attributes },
            children,
          },
        }) {
          if (
            t.isJSXIdentifier(name) &&
            children.length === 1 &&
            t.isJSXText(children[0]) &&
            (!tag || name.name === tag) &&
            (!_class ||
              attributes.some(
                (attribute) =>
                  t.isJSXAttribute(attribute) &&
                  t.isJSXIdentifier(attribute.name) &&
                  (attribute.name.name === "class" || attribute.name.name === "className") &&
                  t.isStringLiteral(attribute.value) &&
                  attribute.value.value.split(/ +/).includes(_class),
              ))
          ) {
            const value = children[0].value.trim();

            if (value.startsWith("&#x")) {
              const codepoint = value.slice(3);

              if (codepointSet.has(codepoint)) {
                collectedCodepointSet.add(codepoint);
              }
            } else {
              const codepoint = codepoints[value];

              if (codepoint) {
                collectedCodepointSet.add(codepoint);
              }
            }
          }
        },
      });
    }),
  );

  return collectedCodepointSet;
};
