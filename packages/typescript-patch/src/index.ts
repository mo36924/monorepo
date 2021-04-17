import { createHash } from "crypto";
import { constants, promises } from "fs";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";
import type { default as typescript, TaggedTemplateExpression, TypeChecker } from "typescript";
import {
  checker,
  getEffectiveCallArguments,
  getEffectiveCallArgumentsWithComment,
  typescriptNames,
  typescriptNamespace,
} from "./constants";

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

export default async () => {
  const selfFilename = fileURLToPath(import.meta.url);
  const selfCode = await readFile(selfFilename, "utf-8");
  const hash = createHash("sha256").update(selfCode).digest("hex");
  const _require = createRequire(selfFilename);
  const patchPath = `${_require.resolve("typescript")}.patch`;
  const typescriptPaths = typescriptNames.map((typescriptName) => join(patchPath, "..", typescriptName));
  const copyPath = (path: string) => `${path}_`;

  try {
    const _hash = await readFile(patchPath, "utf-8");

    if (hash === _hash) {
      return;
    }
  } catch {
    await Promise.allSettled(
      typescriptPaths.map((typescriptPath) =>
        copyFile(typescriptPath, copyPath(typescriptPath), constants.COPYFILE_EXCL),
      ),
    );
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

  await Promise.all([
    writeFile(patchPath, hash),
    ...typescriptPaths.map(async (typescriptPath) => {
      let code = await readFile(copyPath(typescriptPath), "utf-8");

      code = code
        .replace(typescriptNamespace, replaceTypescriptNamespace)
        .replace(checker, replaceChecker)
        .replace(getEffectiveCallArguments, replaceGetEffectiveCallArguments)
        .replace(getEffectiveCallArgumentsWithComment, replaceGetEffectiveCallArgumentsWithComment);

      await writeFile(typescriptPath, code);
    }),
  ]);
};
