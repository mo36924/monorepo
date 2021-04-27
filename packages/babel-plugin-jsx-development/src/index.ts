import { relative } from "path";
import type { default as babel, PluginObj, PluginPass } from "@babel/core";

type State = PluginPass & { displayName: string; hasJsx: boolean };

const cwd = process.cwd();

export default ({ types: t }: typeof babel): PluginObj<State> => {
  return {
    pre() {
      this.displayName = relative(cwd, this.filename);
    },
    visitor: {
      Program: {
        exit(path, state) {
          if (state.hasJsx) {
            path.unshiftContainer("body", t.importDeclaration([], t.stringLiteral("@mo36924/react-refresh-runtime")));
          }
        },
      },
      ExportDefaultDeclaration(path, state) {
        const {
          node: { declaration },
          scope,
        } = path;

        if (!/\.(t|j)sx$/.test(state.displayName) || !t.isArrowFunctionExpression(declaration)) {
          return;
        }

        const uid = scope.generateUid("Component");
        const { params, generator, async } = declaration;
        let body = declaration.body;

        if (t.isExpression(body)) {
          body = t.blockStatement([t.returnStatement(body)]);
        }

        const [nodePath] = path.replaceWithMultiple([
          t.variableDeclaration("const", [
            t.variableDeclarator(t.identifier(uid), t.functionExpression(null, params, body, generator, async)),
          ]),
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
        state.hasJsx = true;
      },
    },
  };
};
