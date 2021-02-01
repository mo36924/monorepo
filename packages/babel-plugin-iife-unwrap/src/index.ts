import type { default as babel, PluginObj } from "@babel/core";

export default ({ types: t }: typeof babel): PluginObj => {
  return {
    name: "iife-unwrap",
    visitor: {
      Program: {
        enter(path) {
          const node = path.node;

          if (node.body.length !== 1) {
            return;
          }

          const statement = node.body[0];

          if (!t.isExpressionStatement(statement)) {
            return;
          }

          let expression = statement.expression;

          if (t.isUnaryExpression(expression) && expression.operator === "!") {
            expression = expression.argument;
          }

          if (!t.isCallExpression(expression) || expression.arguments.length !== 0) {
            return;
          }

          const callee = expression.callee;

          if (
            (!t.isFunctionExpression(callee) && !t.isArrowFunctionExpression(callee)) ||
            callee.params.length !== 0 ||
            callee.async === true ||
            callee.generator === true
          ) {
            return;
          }

          const body = callee.body;

          if (t.isBlockStatement(body)) {
            if (body.body.some((statement) => t.isReturnStatement(statement))) {
              return;
            }

            path.replaceWith(t.program(body.body, node.directives, node.sourceType, node.interpreter));
          } else {
            if (!t.isStatement(body)) {
              return;
            }

            path.replaceWith(t.program([body], node.directives, node.sourceType, node.interpreter));
          }
        },
      },
    },
  };
};
