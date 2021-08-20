import { dirname, relative, resolve, sep } from "path";
import type { default as babel, NodePath, PluginObj, types as t } from "@babel/core";

export type Options = {
  baseUrl?: string;
  paths?: {
    [prefix: string]: string;
  };
  relative?: boolean;
};
type State = {
  filename?: string;
};

export default (
  { types: t }: typeof babel,
  { baseUrl = ".", paths = {}, relative: optionRelative = true }: Options,
): PluginObj<State> => {
  const basePath = resolve(baseUrl);
  const pathEntries = Object.entries(paths);

  const replacePath = (path: string, request: string) => {
    const pathEntry = pathEntries.find((pathEntry) => request.startsWith(pathEntry[0]));

    if (!pathEntry) {
      return request;
    }

    request = resolve(basePath, pathEntry[1] + request.slice(pathEntry[0].length));

    if (optionRelative) {
      const dir = dirname(path);
      request = relative(dir, request);

      if (request[0] !== "/" && request[0] !== ".") {
        request = "./" + request;
      }
    }

    return request.split(sep).join("/");
  };

  const transformDeclaration = (
    path: NodePath<t.ImportDeclaration> | NodePath<t.ExportAllDeclaration> | NodePath<t.ExportNamedDeclaration>,
    state: State,
  ) => {
    const { source } = path.node;

    if (!state.filename || !source) {
      return;
    }

    const modulePath = replacePath(state.filename, source.value);
    const sourcePath = path.get("source");

    if (Array.isArray(sourcePath)) {
      return;
    }

    sourcePath.replaceWith(t.stringLiteral(modulePath));
  };

  const transformImport = (path: NodePath<t.Import>, state: State) => {
    if (!state.filename || !path.parentPath.isCallExpression()) {
      return;
    }

    const arg = path.parentPath.get("arguments")[0];
    let modulePath: string | undefined;

    if (arg.isTemplateLiteral() && arg.node.expressions.length === 0) {
      modulePath = arg.node.quasis[0].value.cooked;
    }

    if (arg.isStringLiteral()) {
      modulePath = arg.node.value;
    }

    if (!modulePath) {
      return;
    }

    modulePath = replacePath(state.filename, modulePath);
    arg.replaceWith(t.stringLiteral(modulePath));
  };

  return {
    name: "replace-path",
    visitor: {
      ImportDeclaration: transformDeclaration,
      ExportAllDeclaration: transformDeclaration,
      ExportNamedDeclaration: transformDeclaration,
      Import: transformImport,
    },
  };
};
