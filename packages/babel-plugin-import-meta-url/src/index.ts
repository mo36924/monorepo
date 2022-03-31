import type { PluginObj, default as babel } from "@babel/core";

export default ({ types: t, template }: typeof babel): PluginObj => {
  const node = template.expression.ast('require("url").pathToFileURL(__filename).href');
  return {
    name: "import-meta-url",
    visitor: {
      MemberExpression(path) {
        if (path.get("object").isMetaProperty() && path.get("property").isIdentifier({ name: "url" })) {
          path.replaceWith(t.cloneNode(node));
        }
      },
    },
  };
};
