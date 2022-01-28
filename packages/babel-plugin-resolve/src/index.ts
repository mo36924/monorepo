import fs from "fs";
import { builtinModules } from "module";
import { dirname, relative, resolve as resolvePath } from "path";
import type { default as babel, NodePath, PluginObj, types as t } from "@babel/core";
import enhancedResolve, { ResolveOptions } from "enhanced-resolve";

const create = enhancedResolve.create;

export type Options = {
  ignoreBuiltins?: boolean;
  ignoreBareImport?: boolean;
  ignore?: (string | RegExp)[];
  baseUrl?: string;
  paths?: {
    [prefix: string]: string;
  };
  pathRegexps?: {
    [regexp: string]: string;
  };
  relative?: boolean;
  cache?: boolean;
} & Partial<ResolveOptions>;
type State = {
  file: { metadata: { deps: string[] } };
  filename?: string;
};

export default (
  { types: t }: typeof babel,
  {
    ignoreBuiltins,
    ignoreBareImport,
    ignore = [],
    baseUrl = ".",
    paths = {},
    pathRegexps: optionPathRegexps = {},
    relative: optionRelative = true,
    cache = false,
    ...resolveOptions
  }: Options,
): PluginObj<State> => {
  // /^\0/ rollup helper
  const ignores = [/^\0/, ...ignore];

  if (ignoreBuiltins) {
    ignores.push(...builtinModules);
  }

  if (ignoreBareImport) {
    ignores.push(/^@?[A-Za-z]/);
  }

  const basePath = resolvePath(baseUrl);

  const pathEntries = Object.entries(paths).map<[string, string]>(([prefix, path]) => [prefix, path]);

  const pathRegexps = Object.entries(optionPathRegexps).map<[RegExp, string]>(([regexp, path]) => [
    new RegExp(regexp),
    path,
  ]);

  if (!cache) {
    resolveOptions.fileSystem = fs as any;
  }

  resolveOptions = {
    conditionNames: ["import"],
    extensions: [".tsx", ".ts", ".jsx", ".mjs", ".js", ".cjs", ".json", ".node"],
    ...resolveOptions,
  };

  const enhancedResolve = create.sync(resolveOptions);

  const resolve = (path: string, request: string, deps: string[]) => {
    if (ignores.some((ignore) => (typeof ignore === "string" ? ignore === request : ignore.test(request)))) {
      deps.push(request);
      return request;
    }

    for (const [prefix, path] of pathEntries) {
      if (request.startsWith(prefix)) {
        request = resolvePath(basePath, path + request.slice(prefix.length));
        break;
      }
    }

    for (const [regexp, path] of pathRegexps) {
      if (regexp.test(request)) {
        request = resolvePath(basePath, request.replace(regexp, path));
        break;
      }
    }

    const dir = dirname(path);
    request = enhancedResolve(dir, request) || request;
    deps.push(request);

    if (optionRelative) {
      request = relative(dir, request);

      if (request[0] !== "/" && request[0] !== ".") {
        request = "./" + request;
      }
    }

    return request;
  };

  const transformDeclaration = (
    path: NodePath<t.ImportDeclaration> | NodePath<t.ExportAllDeclaration> | NodePath<t.ExportNamedDeclaration>,
    state: State,
  ) => {
    const { source } = path.node;

    if (!state.filename || !source) {
      return;
    }

    let modulePath = source.value;

    try {
      modulePath = resolve(state.filename, modulePath, state.file.metadata.deps);
    } catch (e: any) {
      console.log(path.buildCodeFrameError(e?.message));
      return;
    }

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

    try {
      modulePath = resolve(state.filename, modulePath, state.file.metadata.deps);
    } catch (e: any) {
      console.log(path.buildCodeFrameError(e?.message));
      return;
    }

    arg.replaceWith(t.stringLiteral(modulePath));
  };

  return {
    name: "resolve",
    pre(_state) {
      this.file.metadata.deps = [];
    },
    post() {
      this.file.metadata.deps = [...new Set(this.file.metadata.deps)];
    },
    visitor: {
      ImportDeclaration: transformDeclaration,
      ExportAllDeclaration: transformDeclaration,
      ExportNamedDeclaration: transformDeclaration,
      Import: transformImport,
    },
  };
};
