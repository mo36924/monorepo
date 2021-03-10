import fs from "fs";
import { builtinModules } from "module";
import { dirname, relative, resolve as resolvePath, sep } from "path";
import type { default as babel, NodePath, PluginObj, types as t, PluginPass } from "@babel/core";
import enhancedResolve, { ResolveOptions } from "enhanced-resolve";

const create = enhancedResolve.create;

export type Options = {
  ignore?: (string | RegExp)[];
  cache?: boolean;
} & Partial<ResolveOptions>;

export default ({ types: t }: typeof babel, { ignore = [], cache = false, ...resolveOptions }: Options): PluginObj => {
  // /^\0/ rollup helper
  const ignores = [/^\0/, /^[^@A-Za-z]/, /^[^\/]+$/, /^@[^\/]+?(\/[^\/]+)?$/, ...ignore, ...builtinModules];
  const nodeModules = resolvePath("node_modules");

  if (!cache) {
    resolveOptions.fileSystem = fs as any;
  }

  const exportsFieldsResolve = create.sync({
    ...resolveOptions,
    conditionNames: ["import"],
    exportsFields: ["exports"],
    extensions: [],
    mainFields: [],
    mainFiles: [],
    modules: ["node_modules"],
  });

  const subpathResolve = create.sync({
    ...resolveOptions,
    conditionNames: [],
    exportsFields: [],
    extensions: [".mjs", ".js", ".cjs"],
    mainFields: [],
    mainFiles: ["index"],
    modules: ["node_modules"],
  });

  const resolve = (path: string, request: string) => {
    if (ignores.some((ignore) => (typeof ignore === "string" ? ignore === request : ignore.test(request)))) {
      return request;
    }

    const dir = dirname(path);

    try {
      if (exportsFieldsResolve(dir, request)) {
        return request;
      }
    } catch {}

    let resolved: string | false | undefined;

    try {
      resolved = subpathResolve(dir, request);
    } catch {}

    if (!resolved) {
      return request;
    }

    const relativePath = relative(nodeModules, resolved).split(sep).join("/");

    if (relativePath.startsWith(request)) {
      return relativePath;
    }

    return request;
  };

  const transformDeclaration = (
    path: NodePath<t.ImportDeclaration> | NodePath<t.ExportAllDeclaration> | NodePath<t.ExportNamedDeclaration>,
    state: PluginPass,
  ) => {
    const source = path.node.source;

    if (!state.filename || !source) {
      return;
    }

    let modulePath = source.value;

    try {
      modulePath = resolve(state.filename, modulePath);
    } catch (e) {
      console.log(path.buildCodeFrameError(e?.message));
      return;
    }

    const sourcePath = path.get("source");

    if (Array.isArray(sourcePath)) {
      return;
    }

    sourcePath.replaceWith(t.stringLiteral(modulePath));
  };

  const transformImport = (path: NodePath<t.Import>, state: PluginPass) => {
    if (!state.filename || !path.parentPath.isCallExpression()) {
      return;
    }

    const arg = path.parentPath.get("arguments.0");

    if (Array.isArray(arg)) {
      return;
    }

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
      modulePath = resolve(state.filename, modulePath);
    } catch (e) {
      console.log(path.buildCodeFrameError(e?.message));
      return;
    }

    arg.replaceWith(t.stringLiteral(modulePath));
  };

  return {
    name: "resolve-subpath",
    visitor: {
      ImportDeclaration: transformDeclaration,
      ExportAllDeclaration: transformDeclaration,
      ExportNamedDeclaration: transformDeclaration,
      Import: transformImport,
    },
  };
};
