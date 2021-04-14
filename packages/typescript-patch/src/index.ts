import { access, readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import type { TypeChecker } from "typescript";

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

export const hookName = "taggedTemplateExpressionHook";
export const checker = "var checker = {";
export const getEffectiveCallArguments = "function getEffectiveCallArguments(node) {";

export const patch = async () => {
  let path: string | undefined;

  try {
    const require = createRequire(join(process.cwd(), "index.js"));
    path = `${require.resolve("typescript")}.patch`;
  } catch {
    return;
  }

  try {
    await access(path);
    return;
  } catch {
    await writeFile(path, "");
  }

  const replaceChecker = `${checker}
            createTupleType: createTupleType,
            getLiteralType: getLiteralType,
            getIntersectionType: getIntersectionType,
            createSyntheticExpression: createSyntheticExpression,
            getGlobalType: getGlobalType,
            createSymbolTable: ts.createSymbolTable,
            emptyArray: ts.emptyArray,
`;

  const replaceGetEffectiveCallArguments = `${getEffectiveCallArguments}
            if (node.kind === 205 && ts.${hookName}) {
              var args = ts.${hookName}(node, checker);
              if(args){
                  return args;
              }
            }
`;

  const files = [
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/tsserver.js",
    "node_modules/typescript/lib/tsserverlibrary.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript/lib/typescriptServices.js",
    "node_modules/typescript/lib/typingsInstaller.js",
  ];

  await Promise.all(
    files.map(async (file) => {
      let code = await readFile(file, "utf-8");
      code = code.replace(checker, replaceChecker).replace(getEffectiveCallArguments, replaceGetEffectiveCallArguments);
      await writeFile(file, code);
    }),
  );
};
