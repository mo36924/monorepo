import { promises } from "fs";
import type { default as typescript, TaggedTemplateExpression, TypeChecker } from "typescript";

const { access, readFile, writeFile } = promises;

export type Typescript = typeof typescript & {
  taggedTemplateExpressionHooks?: TaggedTemplateExpressionHook[];
};
export type Checker = TypeChecker & {
  createTupleType: any;
  getLiteralType: any;
  getIntersectionType: any;
  createSyntheticExpression: any;
  getGlobalType: any;
  createSymbolTable: any;
  emptyArray: any;
  createSymbol: any;
  createAnonymousType: any;
  createArrayType: any;
  getUnionType: any;
  getNullType: any;
  getStringType: any;
  getNumberType: any;
  getBooleanType: any;
  getAnyType: any;
  getNeverType: any;
};
export type TaggedTemplateExpressionHook = (ts: Typescript, node: TaggedTemplateExpression, checker: Checker) => any;
export const typescriptNamespace = "var ts;";
export const checker = "var checker = {";
export const getEffectiveCallArguments =
  "function getEffectiveCallArguments(node) {\n            if (node.kind === 205) {";
export const getEffectiveCallArgumentsWithComment =
  "function getEffectiveCallArguments(node) {\n            if (node.kind === 205 /* TaggedTemplateExpression */) {";
export const files = [
  "node_modules/typescript/lib/tsc.js",
  "node_modules/typescript/lib/tsserver.js",
  "node_modules/typescript/lib/tsserverlibrary.js",
  "node_modules/typescript/lib/typescript.js",
  "node_modules/typescript/lib/typescriptServices.js",
  "node_modules/typescript/lib/typingsInstaller.js",
];

export const patch = async () => {
  const path = "node_modules/typescript/lib/patch";
  const taggedTemplateExpressionHooks = "taggedTemplateExpressionHooks";

  try {
    await access(path);
    return;
  } catch {
    await writeFile(path, "");
  }

  const replaceTypescriptNamespace = `var ts;
(function (ts) {
    ts.${taggedTemplateExpressionHooks} = [];
})(ts || (ts = {}));
var ts;`;

  const replaceChecker = `${checker}
            createTupleType: createTupleType,
            getLiteralType: getLiteralType,
            getIntersectionType: getIntersectionType,
            createSyntheticExpression: createSyntheticExpression,
            getGlobalType: getGlobalType,
            createSymbolTable: ts.createSymbolTable,
            emptyArray: ts.emptyArray,`;

  const callTaggedTemplateExpressionHooks = `
                for (var i = 0; i < ts.${taggedTemplateExpressionHooks}.length; i++) {
                    var args = ts.${taggedTemplateExpressionHooks}[i](ts, node, checker);
                    if (args) {
                        return args;
                    }
                }`;

  const replaceGetEffectiveCallArguments = `${getEffectiveCallArguments}${callTaggedTemplateExpressionHooks}`;
  const replaceGetEffectiveCallArgumentsWithComment = `${getEffectiveCallArgumentsWithComment}${callTaggedTemplateExpressionHooks}`;

  await Promise.all(
    files.map(async (file) => {
      let code = await readFile(file, "utf-8");

      code = code
        .replace(typescriptNamespace, replaceTypescriptNamespace)
        .replace(checker, replaceChecker)
        .replace(getEffectiveCallArguments, replaceGetEffectiveCallArguments)
        .replace(getEffectiveCallArgumentsWithComment, replaceGetEffectiveCallArgumentsWithComment);

      await writeFile(file, code);
    }),
  );
};
