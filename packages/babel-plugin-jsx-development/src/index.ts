import { relative } from "path";
import type { default as babel, PluginObj, PluginPass } from "@babel/core";
import { pascalCase } from "change-case";

type State = PluginPass & { displayName: string };

const cwd = process.cwd();

export default ({ types: t, template }: typeof babel): PluginObj<State> => {
  return {
    pre() {
      this.displayName = pascalCase(relative(cwd, this.filename.replace(/\.(t|j)sx$/, "")));
    },
    visitor: {
      Program: {
        exit(path, state) {
          if (state.filename.endsWith("/node_modules/react-dom/index.js")) {
            path.unshiftContainer(
              "body",
              template.statements.ast(`
                import _ReactRefreshRuntime from "react-refresh/runtime";
                _ReactRefreshRuntime.injectIntoGlobalHook(globalThis);
                globalThis.$RefreshReg$ = () => {};
                globalThis.$RefreshSig$ = () => (type) => type;
              `),
            );
          }
        },
      },
      ExportDefaultDeclaration(path, state) {
        const {
          node: { declaration },
          scope,
        } = path;

        if (
          !/\.(t|j)sx$/.test(state.filename) ||
          !t.isArrowFunctionExpression(declaration) ||
          scope.hasBinding(state.displayName)
        ) {
          return;
        }

        const uid = state.displayName;
        const { params, generator, async } = declaration;
        let body = declaration.body;

        if (t.isExpression(body)) {
          body = t.blockStatement([t.returnStatement(body)]);
        }

        const [nodePath] = path.replaceWithMultiple([
          t.functionDeclaration(t.identifier(uid), params, body, generator, async),
          t.expressionStatement(
            t.assignmentExpression(
              "??=",
              t.memberExpression(t.identifier(uid), t.identifier("displayName")),
              t.stringLiteral(state.displayName),
            ),
          ),
          t.expressionStatement(
            t.assignmentExpression(
              "??=",
              t.memberExpression(t.identifier(uid), t.identifier("url")),
              t.memberExpression(t.metaProperty(t.identifier("import"), t.identifier("meta")), t.identifier("url")),
            ),
          ),
          t.exportDefaultDeclaration(t.identifier(uid)),
        ]);

        scope.registerDeclaration(nodePath);
      },
    },
  };
};
