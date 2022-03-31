import type { PluginObj, default as babel } from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";

export type Options = {
  tag?: string;
  class?: string;
  codepoints?: {
    [ligature: string]: string;
  };
};

const _jsx = jsx.default || jsx;
const emptyCodepoints: Required<Options>["codepoints"] = Object.create(null);

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  const tag = options.tag;
  const _class = "class" in options ? options.class : "material-icons";
  const codepoints = options.codepoints || emptyCodepoints;
  return {
    name: "replace-jsx-ligature",
    inherits: _jsx,
    visitor: {
      JSXElement(path) {
        const {
          node: {
            openingElement: { name, attributes },
            children,
          },
        } = path;

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
          const ligature = children[0].value.trim();
          const codepoint = codepoints[ligature];

          if (codepoint) {
            const value = `&#x${codepoint}`;
            path.get("children")[0].replaceWith(t.jsxText(value));
          }
        }
      },
    },
  };
};
