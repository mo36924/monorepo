import { createHash } from "crypto";
import { constants, promises } from "fs";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";
import {
  checker,
  getEffectiveCallArgumentsRegexp,
  typescriptDeclarationNames,
  typescriptNames,
  typescriptNamespace,
} from "./constants";

const { copyFile, readFile, writeFile } = promises;

export default async () => {
  const selfFilename = fileURLToPath(import.meta.url);
  const selfCode = await readFile(selfFilename, "utf-8");
  const hash = createHash("sha256").update(selfCode).digest("hex");
  const _require = createRequire(selfFilename);
  const patchPath = `${_require.resolve("typescript")}.patch`;
  const resolvePath = (path: string) => join(patchPath, "..", path);
  const typescriptPaths = typescriptNames.map(resolvePath);
  const typescriptDeclarationPaths = typescriptDeclarationNames.map(resolvePath);
  const copyPath = (path: string) => `${path}_`;

  try {
    const _hash = await readFile(patchPath, "utf-8");

    if (hash === _hash) {
      return;
    }
  } catch {
    await Promise.allSettled(
      [...typescriptPaths, ...typescriptDeclarationPaths].map((path) =>
        copyFile(path, copyPath(path), constants.COPYFILE_EXCL),
      ),
    );
  }

  const replaceTypescriptNamespace = `${typescriptNamespace}
(function (ts) {
    ts.taggedTemplateExpressionHooks = [];
})(ts || (ts = {}));
${typescriptNamespace}`;

  const replaceChecker = `${checker}
            createTupleType: createTupleType,
            getLiteralType: getLiteralType,
            getIntersectionType: getIntersectionType,
            createSyntheticExpression: createSyntheticExpression,
            getSymbol: getSymbol,
            getGlobalSymbol: getGlobalSymbol,
            getExportsOfSymbol: getExportsOfSymbol,
            getGlobalType: getGlobalType,
            createSymbolTable: ts.createSymbolTable,
            emptyArray: ts.emptyArray,
            getUnknownType: function () { return unknownType; },`;

  const replaceGetEffectiveCallArguments = `
        function getEffectiveCallArguments(node) {
            if (node.kind === 205) {
                for (var i = 0; i < ts.taggedTemplateExpressionHooks.length; i++) {
                    var args = ts.taggedTemplateExpressionHooks[i](ts, node, checker);
                    if (args) {
                        return args;
                    }
                }
                var template = node.template;
                var args = [];
                if (ts.isNoSubstitutionTemplateLiteral(template)) {
                    var arrayType = createTupleType([getLiteralType(template.text)], undefined, true);
                    var rawType = createTupleType([getLiteralType(template.rawText)], undefined, true);
                    var rawSymbol = createSymbol(4 /* Property */, "raw", 8 /* Readonly */);
                    rawSymbol.type = rawType;
                    var symbolTable = ts.createSymbolTable([rawSymbol]);
                    var objectType = createAnonymousType(undefined, symbolTable, ts.emptyArray, ts.emptyArray, undefined, undefined);
                    var stringsType = getIntersectionType([arrayType, objectType]);
                    args.push(createSyntheticExpression(template, stringsType));
                } else {
                    var texts = [getLiteralType(template.head.text)];
                    var rawTexts = [getLiteralType(template.head.rawText)];
                    for (var i = 0; i < template.templateSpans.length; i++) {
                        var span = template.templateSpans[i];
                        texts.push(getLiteralType(span.literal.text));
                        rawTexts.push(getLiteralType(span.literal.rawText));
                        args.push(span.expression);
                    }
                    var arrayType = createTupleType(texts, undefined, true);
                    var rawType = createTupleType(rawTexts, undefined, true);
                    var rawSymbol = createSymbol(4 /* Property */, "raw", 8 /* Readonly */);
                    rawSymbol.type = rawType;
                    var symbolTable = ts.createSymbolTable([rawSymbol]);
                    var objectType = createAnonymousType(undefined, symbolTable, ts.emptyArray, ts.emptyArray, undefined, undefined);
                    var stringsType = getIntersectionType([arrayType, objectType]);
                    args.unshift(createSyntheticExpression(template, stringsType));
                }
                return args;
            }`;

  const appendDeclaration = `
declare namespace ts {
    export interface TypeChecker {
        createTupleType(elementTypes: Type[], elementFlags?: ElementFlags, readonly?: boolean, namedMemberDeclarations?: any): TupleType;
        getLiteralType(value: any, enumId?: any, symbol?: any): LiteralType;
        getIntersectionType(types: Type[], aliasSymbol?: Symbol, aliasTypeArguments?: any): IntersectionType;
        createSyntheticExpression(parent: Expression, type: Type, isSpread?: boolean, tupleNameSource?: any): SyntheticExpression;
        getSymbol(symbols: Map<Symbol>, name: string, meaning: SymbolFlags): Symbol | undefined;
        getGlobalSymbol(name: string, meaning: SymbolFlags, diagnostic?: any): Symbol | undefined;
        getExportsOfSymbol(symbol: Symbol): Map<Symbol>;
        getGlobalType(name: string, arity: number, reportErrors: boolean): Type | undefined;
        createSymbolTable(symbols?: Symbol[]): Map<Symbol>;
        emptyArray: any;
        getUnknownType(): Type;
        createSymbol(flags: SymbolFlags, name: string, checkFlags?: number): Symbol;
        createAnonymousType(symbol?: Symbol, members?: any, callSignatures?: any, constructSignatures?: any, stringIndexInfo?: any, numberIndexInfo?: any): Type;
        createArrayType(type: Type, readonly?: boolean): Type;
        getUnionType(types: Type[], unionReduction?: any, aliasSymbol?: any, aliasTypeArguments?: any, origin?: any): UnionType;
        getNullType(): Type;
        getStringType(): StringLiteralType;
        getNumberType(): NumberLiteralType;
        getBooleanType(): Type;
        getAnyType(): Type;
        getNeverType(): Type;
    }
    export type TaggedTemplateExpressionHook = (typescript: Omit<typeof ts, "server">, node: TaggedTemplateExpression, checker: TypeChecker) => Expression[] | void;
    const taggedTemplateExpressionHooks: TaggedTemplateExpressionHook[];
    const emptyArray: any;
    const createSymbolTable: (symbols?: Symbol[]) => Map<Symbol>;
}
`;

  await Promise.all([
    writeFile(patchPath, hash),
    ...typescriptPaths.map(async (typescriptPath) => {
      let code = await readFile(copyPath(typescriptPath), "utf-8");

      code = code
        .replace(typescriptNamespace, replaceTypescriptNamespace)
        .replace(checker, replaceChecker)
        .replace(getEffectiveCallArgumentsRegexp, replaceGetEffectiveCallArguments);

      await writeFile(typescriptPath, code);
    }),
    ...typescriptDeclarationPaths.map(async (typescriptDeclarationPath) => {
      let code = await readFile(copyPath(typescriptDeclarationPath), "utf-8");
      code += appendDeclaration;
      await writeFile(typescriptDeclarationPath, code);
    }),
  ]);
};
