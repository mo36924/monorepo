import { createRequire } from "module";
import { resolve } from "path";
import type { NodePath, PluginObj, PluginPass, default as babel } from "@babel/core";

export type Options = { [name: string]: string[] };

type State = PluginPass & {
  hasRequire: boolean;
};

const _require = createRequire(resolve("index.js"));

export default ({ types: t }: typeof babel, options: Options): PluginObj<State> => {
  const namedExports: Options = Object.create(null);

  for (const [mod, names] of Object.entries(options)) {
    namedExports[_require.resolve(mod)] = names;
  }

  const log = (path: NodePath<any>, msg: string) => {
    console.error(path.buildCodeFrameError(path.state.filename + "\n" + msg).message);
    process.exitCode = 1;
  };

  return {
    name: "commonjs",
    visitor: {
      Program: {
        enter(path, state) {
          const scope = path.scope;
          const hasModule = scope.hasGlobal("module");
          const hasExports = scope.hasGlobal("exports");
          const hasRequire = scope.hasGlobal("require");
          state.hasRequire = hasRequire;

          if (!hasModule && !hasExports) {
            return;
          }

          const names = namedExports[state.filename!];
          const hasNamedExports = !!names;

          let moduleExports = hasModule
            ? t.memberExpression(t.identifier("module"), t.identifier("exports"))
            : t.identifier("exports");

          if (hasModule) {
            if (hasExports) {
              path.unshiftContainer(
                "body",
                t.variableDeclaration("const", [
                  t.variableDeclarator(t.identifier("exports"), t.objectExpression([])),
                  t.variableDeclarator(
                    t.identifier("module"),
                    t.objectExpression([
                      t.objectProperty(t.identifier("exports"), t.identifier("exports"), false, true),
                    ]),
                  ),
                ]),
              );

              path.pushContainer(
                "body",
                t.exportDefaultDeclaration(t.memberExpression(t.identifier("module"), t.identifier("exports"))),
              );
            } else {
              const moduleExportsPath = path.unshiftContainer(
                "body",
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.identifier("module"),
                    t.objectExpression([t.objectProperty(t.identifier("exports"), t.objectExpression([]))]),
                  ),
                ]),
              )[0];

              scope.crawl();

              const {
                references,
                referencePaths: { 0: referencePath },
              } = scope.getBinding("module")!;

              if (
                references === 1 &&
                referencePath.parentPath?.matchesPattern("module.exports") &&
                referencePath.parentPath.parentPath?.isAssignmentExpression() &&
                referencePath.parentPath.parentPath.parentPath.isExpressionStatement() &&
                referencePath.parentPath.parentPath.parentPath.parentPath.isProgram()
              ) {
                if (hasNamedExports) {
                  const moduleExportsId = scope.generateUid("module.exports");

                  referencePath.parentPath.parentPath.parentPath.replaceWithMultiple([
                    t.variableDeclaration("const", [
                      t.variableDeclarator(
                        t.identifier(moduleExportsId),
                        referencePath.parentPath.parentPath.node.right,
                      ),
                    ]),
                    t.exportDefaultDeclaration(t.identifier(moduleExportsId)),
                  ]);

                  moduleExportsPath.remove();
                  moduleExports = t.identifier(moduleExportsId);
                } else {
                  referencePath.parentPath.parentPath.parentPath.replaceWith(
                    t.exportDefaultDeclaration(referencePath.parentPath.parentPath.node.right),
                  );

                  moduleExportsPath.remove();
                }
              } else {
                path.pushContainer(
                  "body",
                  t.exportDefaultDeclaration(t.memberExpression(t.identifier("module"), t.identifier("exports"))),
                );
              }
            }
          } else {
            path.unshiftContainer(
              "body",
              t.variableDeclaration("const", [t.variableDeclarator(t.identifier("exports"), t.objectExpression([]))]),
            );

            path.pushContainer("body", t.exportDefaultDeclaration(t.identifier("exports")));
          }

          if (!hasNamedExports) {
            return;
          }

          const hasBoundName = names.some((name) => scope.hasGlobal(name) || scope.hasBinding(name));

          if (hasBoundName) {
            const uids = names.map((name) => [
              name,
              scope.hasGlobal(name) || scope.hasBinding(name) ? scope.generateUid(name) : name,
            ]);

            path.pushContainer("body", [
              t.variableDeclaration("const", [
                t.variableDeclarator(
                  t.objectPattern(
                    uids.map(([key, value]) =>
                      key === value
                        ? t.objectProperty(t.identifier(key), t.identifier(key), false, true)
                        : t.objectProperty(t.identifier(key), t.identifier(value)),
                    ),
                  ),
                  moduleExports,
                ),
              ]),
              t.exportNamedDeclaration(
                null,
                uids.map(([key, value]) => t.exportSpecifier(t.identifier(key), t.identifier(value))),
              ),
            ]);
          } else {
            path.pushContainer(
              "body",
              t.exportNamedDeclaration(
                t.variableDeclaration("const", [
                  t.variableDeclarator(
                    t.objectPattern(
                      names.map((name) => t.objectProperty(t.identifier(name), t.identifier(name), false, true)),
                    ),
                    moduleExports,
                  ),
                ]),
              ),
            );
          }
        },
      },
      Directive(path) {
        if (path.node.value.value === "use strict") {
          path.remove();
        }
      },
      CallExpression(path, state) {
        if (!state.hasRequire) {
          return;
        }

        const { node, scope } = path;
        const { callee, arguments: args } = node;

        if (!t.isIdentifier(callee) || callee.name !== "require" || scope.hasBinding("require")) {
          return;
        }

        if (args.length !== 1) {
          log(path, "argument must be one");
          return;
        }

        const arg = args[0];
        let importPath: string | undefined;

        if (t.isStringLiteral(arg)) {
          importPath = arg.value;
        } else if (t.isTemplateLiteral(arg) && arg.expressions.length === 0) {
          importPath = arg.quasis[0].value.cooked ?? "";
        } else {
          log(path, "argument type must be a string");
          return;
        }

        const statement = path.findParent((path) => !!path.parentPath?.isProgram());

        if (!statement) {
          return;
        }

        if (path.parentPath.isExpressionStatement()) {
          statement.insertBefore(t.importDeclaration([], t.stringLiteral(importPath)));
          path.remove();
          return;
        }

        if (
          path.parentPath.isVariableDeclarator() &&
          t.isIdentifier(path.parentPath.node.id) &&
          path.parentPath.parentPath.isVariableDeclaration() &&
          path.parentPath.parentPath.node.kind === "const" &&
          path.parentPath.parentPath.parentPath.isProgram()
        ) {
          const id = t.identifier(path.parentPath.node.id.name);
          statement.insertBefore(t.importDeclaration([t.importDefaultSpecifier(id)], t.stringLiteral(importPath)));

          if (path.parentPath.parentPath.node.declarations.length === 1) {
            path.parentPath.parentPath.remove();
          } else {
            path.parentPath.remove();
          }
        } else {
          const id = scope.generateUidIdentifier(importPath);
          statement.insertBefore(t.importDeclaration([t.importDefaultSpecifier(id)], t.stringLiteral(importPath)));
          path.replaceWith(id);
        }
      },
    },
  };
};
