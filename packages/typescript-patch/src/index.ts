import { createHash } from "crypto";
import { constants, promises } from "fs";
import { fileURLToPath } from "url";
import type { default as typescript, TaggedTemplateExpression, TypeChecker } from "typescript";

const { readFile, writeFile, copyFile } = promises;

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

export default async () => {
  const selfCode = await readFile(fileURLToPath(import.meta.url), "utf-8");
  const hash = createHash("sha256").update(selfCode).digest("hex");
  const patchPath = "node_modules/typescript/lib/patch";
  const copyPath = (path: string) => `${path}_`;

  try {
    const _hash = await readFile(patchPath, "utf-8");

    if (hash === _hash) {
      return;
    }
  } catch {
    await Promise.allSettled(files.map((file) => copyFile(file, copyPath(file), constants.COPYFILE_EXCL)));
  }

  const taggedTemplateExpressionHooks = "taggedTemplateExpressionHooks";

  const replaceTypescriptNamespace = `${typescriptNamespace}
(function (ts) {
    ts.${taggedTemplateExpressionHooks} = [];
})(ts || (ts = {}));
${typescriptNamespace}`;

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

  await Promise.allSettled([
    writeFile(patchPath, hash),
    ...files.map(async (file) => {
      let code = await readFile(copyPath(file), "utf-8");

      code = code
        .replace(typescriptNamespace, replaceTypescriptNamespace)
        .replace(checker, replaceChecker)
        .replace(getEffectiveCallArguments, replaceGetEffectiveCallArguments)
        .replace(getEffectiveCallArgumentsWithComment, replaceGetEffectiveCallArgumentsWithComment);

      await writeFile(file, code);
    }),
  ]);
};
