import type { default as _babel, PluginObj } from "@babel/core";
// @ts-ignore
import babelPluginMinifyDeadCodeElimination from "babel-plugin-minify-dead-code-elimination";

export default (babel: typeof _babel, options: any): PluginObj => {
  const visitor = babelPluginMinifyDeadCodeElimination(babel, options).visitor;
  const _visitor: any = {};

  for (const [key, value] of Object.entries<any>(visitor)) {
    _visitor[key] = typeof value === "function" ? value : { ...value };
  }

  return {
    name: "dead-code-elimination",
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse(_visitor, state);
        },
        exit(path, state) {
          visitor.Program.exit.call(this, path, state);
        },
      },
      Function: {
        exit(path, state) {
          visitor.Function.exit.call(this, path, state);
        },
      },
      IfStatement: {
        enter(path, state) {
          visitor.IfStatement.exit.call(this, path, state);
        },
        exit(path, state) {
          visitor.IfStatement.exit.call(this, path, state);
        },
      },
      EmptyStatement(path, state) {
        visitor.EmptyStatement.call(this, path, state);
      },
    },
  };
};
