import { dirname, isAbsolute, relative, resolve, sep } from "path";
import type { default as babel, NodePath, PluginObj, types as t } from "@babel/core";

export type Options = {
  baseUrl?: string;
  paths?: {
    [prefix: string]: string;
  };
  pathRegexps?: {
    [regexp: string]: string;
  };
  regexps?: {
    [regexp: string]: string;
  };
  relative?: boolean;
  normalize?: boolean;
};
type State = {
  filename?: string;
};

export default (
  { types: t }: typeof babel,
  {
    baseUrl = ".",
    paths = {},
    pathRegexps: optionPathRegexps = {},
    regexps: optionRegexps = {},
    relative: optionRelative = true,
    normalize = true,
  }: Options,
): PluginObj<State> => {
  const basePath = resolve(baseUrl);
  const pathEntries = Object.entries(paths);

  const pathRegexps = Object.entries(optionPathRegexps).map<[RegExp, string]>(([regexp, path]) => [
    new RegExp(regexp),
    path,
  ]);

  const regexps = Object.entries(optionRegexps).map<[RegExp, string]>(([regexp, path]) => [new RegExp(regexp), path]);

  const replacePath = (path: string, request: string) => {
    let _request = request;

    for (const [prefix, path] of pathEntries) {
      if (_request.startsWith(prefix)) {
        _request = resolve(basePath, path + _request.slice(prefix.length));
        break;
      }
    }

    for (const [regexp, path] of pathRegexps) {
      if (regexp.test(_request)) {
        _request = resolve(basePath, _request.replace(regexp, path));
        break;
      }
    }

    for (const [regexp, replaceValue] of regexps) {
      if (regexp.test(_request)) {
        _request = resolve(dirname(path), _request.replace(regexp, replaceValue));
        break;
      }
    }

    if (_request === request) {
      return _request;
    }

    if (optionRelative) {
      _request = relative(dirname(path), _request);

      if (!isAbsolute(_request) && _request[0] !== ".") {
        _request = "." + sep + _request;
      }
    }

    if (normalize) {
      return _request.split(sep).join("/");
    }

    return _request;
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
