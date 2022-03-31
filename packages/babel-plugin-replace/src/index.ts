import type { PluginObj, PluginPass, default as babel } from "@babel/core";

export type Options = {
  [key: string]: any;
};

type ReplaceOptions = {
  identifier: string;
  searchNode: babel.types.Expression;
  replaceNode: babel.types.Expression;
}[];

type State = PluginPass & { replaceOptions: ReplaceOptions };

export default ({ types: t, template }: typeof babel, options: Options): PluginObj<State> => {
  const replaceOptions: ReplaceOptions = Object.entries(options)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([searchValue, replaceValue]) => ({
      identifier: searchValue.match(/^(typeof\s+)?([A-Za-z_$][A-Za-z0-9_$]*)/)?.[2] || "",
      searchNode: template.expression.ast(searchValue),
      replaceNode: template.expression.ast(`${replaceValue}`),
    }));

  for (const { identifier, searchNode, replaceNode } of replaceOptions) {
    // isNodesEquivalent
    if (t.isMemberExpression(searchNode) && (searchNode as any).optional === undefined) {
      replaceOptions.push({ identifier, searchNode: { ...searchNode, optional: null }, replaceNode });
    }
  }

  return {
    name: "replace",
    visitor: {
      Program: {
        enter(path, state) {
          path.scope.crawl();
          const globals = (path.scope as any).globals;
          const globalReplaceOptions = replaceOptions.filter(({ identifier }) => globals[identifier]);
          state.replaceOptions = globalReplaceOptions;

          path.traverse({
            Expression(path) {
              const { node, scope } = path;

              const replaceOption = globalReplaceOptions.find(({ identifier, searchNode }) => {
                return t.isNodesEquivalent(node, searchNode) && !scope.hasBinding(identifier, true);
              });

              if (!replaceOption) {
                return;
              }

              path.replaceWith(t.cloneNode(replaceOption.replaceNode, true));
            },
          });
        },
      },
      Expression(path, state) {
        const { node, scope } = path;

        const replaceOption = state.replaceOptions.find(({ identifier, searchNode }) => {
          return t.isNodesEquivalent(node, searchNode) && !scope.hasBinding(identifier, true);
        });

        if (!replaceOption) {
          return;
        }

        path.replaceWith(t.cloneNode(replaceOption.replaceNode, true));
      },
    },
  };
};
