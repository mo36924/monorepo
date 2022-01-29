import { relative } from "path";
import type { default as babel, PluginObj, PluginPass } from "@babel/core";
import { pascalCase } from "change-case";

type State = PluginPass & { displayName: string };

const cwd = process.cwd();

export default ({ types: t }: typeof babel): PluginObj<State> => {
  return {
    pre() {
      this.displayName = pascalCase(relative(cwd, this.filename!.replace(/\.(t|j)sx$/, "")));
    },
    visitor: {
      Program: {
        exit(path, state) {
          if (!state.filename!.includes("/node_modules/")) {
            path.unshiftContainer("body", t.importDeclaration([], t.stringLiteral("@mo36924/react-refresh-runtime")));
          }
        },
      },
      ExportDefaultDeclaration(path, state) {
        if (!/\.(t|j)sx$/.test(state.filename!)) {
          return;
        }

        const declaration = path.node.declaration;

        if (t.isIdentifier(declaration)) {
          path.insertBefore([
            t.expressionStatement(
              t.assignmentExpression(
                "??=",
                t.memberExpression(t.identifier(declaration.name), t.identifier("displayName")),
                t.stringLiteral(state.displayName),
              ),
            ),
            t.expressionStatement(
              t.assignmentExpression(
                "??=",
                t.memberExpression(t.identifier(declaration.name), t.identifier("url")),
                t.memberExpression(t.metaProperty(t.identifier("import"), t.identifier("meta")), t.identifier("url")),
              ),
            ),
          ]);

          return;
        }

        let expression = declaration;

        if (t.isArrowFunctionExpression(expression)) {
          const { params, generator, async } = expression;
          let body = expression.body;

          if (t.isExpression(body)) {
            body = t.blockStatement([t.returnStatement(body)]);
          }

          expression = t.functionExpression(null, params, body, generator, async);
        }

        let uid = /\W/.test(state.displayName) ? "Component" : state.displayName;
        const scope = path.scope;

        while (scope.hasBinding(uid)) {
          uid += "_";
        }

        const [nodePath] = path.replaceWithMultiple([
          t.variableDeclaration("const", [t.variableDeclarator(t.identifier(uid), expression as any)]),
          t.exportDefaultDeclaration(t.identifier(uid)),
        ]);

        scope.registerDeclaration(nodePath);
      },
    },
  };
};
