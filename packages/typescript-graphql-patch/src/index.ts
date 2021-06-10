/* eslint-disable no-var */
import { createHash } from "crypto";
import { constants } from "fs";
import { copyFile, readFile, writeFile } from "fs/promises";
import { createRequire } from "module";
import { join } from "path";
import { fileURLToPath } from "url";
import type {
  default as graphql,
  GraphQLNamedType,
  GraphQLSchema,
  OperationDefinitionNode,
  SelectionNode,
} from "graphql";
import type {
  default as typescript,
  ElementFlags,
  Expression,
  IntersectionType,
  LiteralType,
  Symbol,
  SymbolFlags,
  SyntheticExpression,
  TaggedTemplateExpression,
  TupleType,
  Type,
  UnionType,
} from "typescript";

type Typescript = typeof typescript & {
  graphql: typeof graphql;
  graphQLSchema: GraphQLSchema;
  createSymbolTable: (symbols?: Symbol[]) => Map<string, Symbol>;
  emptyArray: any;
};

export default async () => {
  const filename = fileURLToPath(import.meta.url);
  const buffer = await readFile(filename);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const _require = createRequire(filename);
  const typescriptPath = _require.resolve("typescript");
  const patchPath = `${typescriptPath}.patch`;
  const resolvePath = (path: string) => join(patchPath, "..", path);
  const copyPath = (path: string) => `${path}_`;

  const typescriptPaths = [
    "tsc.js",
    "tsserver.js",
    "tsserverlibrary.js",
    "typescript.js",
    "typescriptServices.js",
    "typingsInstaller.js",
  ].map(resolvePath);

  try {
    const _hash = await readFile(patchPath, "utf-8");

    if (hash === _hash) {
      return;
    }
  } catch {
    await Promise.allSettled(typescriptPaths.map((path) => copyFile(path, copyPath(path), constants.COPYFILE_EXCL)));
  }

  const ts: Typescript = _require(copyPath(typescriptPath));

  const getFunctionInlineCode = (fn: Function) => {
    let code = fn.toString();
    code = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
    return code;
  };

  const replaceUseStrictCode = (code: string) => {
    return code.replace(`"use strict";\n`, (m) => `${m}${getFunctionInlineCode(getGraphQLInitCode)}`);

    function getGraphQLInitCode() {
      var ts: any;

      (function (ts: Typescript) {
        var fs: typeof import("fs");
        var path: typeof import("path");
        var graphql: typeof import("graphql");
        var index: typeof import("@mo36924/graphql-schema");
        var graphqlPath: string;
        var declarationPath: string;
        var dev = false;

        try {
          fs = require("fs");
          path = require("path");
          graphql = require("graphql");
          index = require("@mo36924/graphql-schema");
          graphqlPath = path.join(__dirname, "..", "..", "..", "index.graphql");
          declarationPath = path.join(__dirname, "..", "..", "@types", "_graphql", "index.d.ts");
          dev = process.env.NODE_ENV === "development";
        } catch (err) {
          return;
        }

        ts.graphql = graphql;
        init();

        function init() {
          try {
            var source = fs.readFileSync(graphqlPath, "utf-8");
            var schema = index.buildSchema(source);
            var declaration = index.buildDeclaration(schema, declarationPath);
            writeFile(declarationPath, declaration);
            ts.graphQLSchema = schema;
          } catch (err) {}

          if (dev) {
            watch();
          }
        }

        function writeFile(filepath: string, data: string) {
          try {
            fs.writeFileSync(filepath, data);
          } catch (err) {
            fs.mkdirSync(path.dirname(filepath), { recursive: true });
            fs.writeFileSync(filepath, data);
          }
        }

        function watch() {
          try {
            var watcher = fs.watch(graphqlPath, function () {
              watcher.close();
              init();
            });
          } catch (err) {
            try {
              fs.watchFile(graphqlPath, function () {
                try {
                  fs.readFileSync(graphqlPath);
                } catch (err) {
                  return;
                }

                fs.unwatchFile(graphqlPath);
                init();
              });
            } catch (err) {}
          }
        }
      })(ts || (ts = {}));
    }
  };

  const replaceGetEffectiveCallArguments = (code: string) => {
    const searchValue = new RegExp(
      `function getEffectiveCallArguments\\(node\\) {\n            if \\(node.kind === ${ts.SyntaxKind.TaggedTemplateExpression}.*?\n`,
    );

    const replaceSymbolFlags = (code: string) => {
      return code.replace(/ts\.SymbolFlags\.(\w+)/g, (_m, p) => ts.SymbolFlags[p]);
    };

    return code.replace(searchValue, (m) =>
      replaceSymbolFlags(`
        ${createPropertySymbolWithType}
        ${getTypescriptType}
        ${getEffectiveGraphQLCallArguments}
        ${m}
        ${getFunctionInlineCode(getEffectiveCallArguments)}
      `),
    );

    var createSymbol: (flags: SymbolFlags, name: string, checkFlags?: number) => Symbol;
    var getGlobalType: (name: string, arity: number, reportErrors: boolean) => Type | undefined;
    var getGlobalSymbol: (name: string, meaning: SymbolFlags, diagnostic?: any) => Symbol | undefined;
    var getExportsOfSymbol: (symbol: Symbol) => Map<string, Symbol>;
    var getSymbol: (symbols: Map<string, Symbol>, name: string, meaning: SymbolFlags) => Symbol | undefined;
    var getDeclaredTypeOfSymbol: (symbol: Symbol) => Type;
    var createArrayType: (type: Type, readonly?: boolean) => Type;
    var getUnionType: (
      types: Type[],
      unionReduction?: any,
      aliasSymbol?: any,
      aliasTypeArguments?: any,
      origin?: any,
    ) => UnionType;
    var stringType: Type;
    var numberType: Type;
    var booleanType: Type;
    var nullType: Type;
    var unknownType: Type;
    var createAnonymousType: (
      symbol?: Symbol,
      members?: any,
      callSignatures?: any,
      constructSignatures?: any,
      stringIndexInfo?: any,
      numberIndexInfo?: any,
    ) => Type;
    var createTupleType: (
      elementTypes: Type[],
      elementFlags?: ElementFlags,
      readonly?: boolean,
      namedMemberDeclarations?: any,
    ) => TupleType;
    var getLiteralType: (value: any, enumId?: any, symbol?: any) => LiteralType;
    var getIntersectionType: (types: Type[], aliasSymbol?: Symbol, aliasTypeArguments?: any) => IntersectionType;
    var createSyntheticExpression: (
      parent: Expression,
      type: Type,
      isSpread?: boolean,
      tupleNameSource?: any,
    ) => SyntheticExpression;

    function createPropertySymbolWithType(name: string, type: Type) {
      var symbol: Symbol & { type?: Type } = createSymbol(ts.SymbolFlags.Property, name);
      symbol.type = type;
      return symbol;
    }

    function getTypescriptType(namedType: GraphQLNamedType) {
      var isScalar = ts.graphql.isScalarType(namedType);
      var name = namedType.name;

      if (isScalar) {
        switch (name) {
          case "ID":
          case "UUID":
          case "String":
            return stringType;
          case "Int":
          case "Float":
            return numberType;
          case "Boolean":
            return booleanType;
          case "Date":
            return getGlobalType("Date", 0, true) || unknownType;
          default:
            throw new Error(`Invalid scalar type: ${name}.`);
        }
      }

      var symbol = getGlobalSymbol("GraphQL", ts.SymbolFlags.Namespace);
      var exportsSymbol = symbol && getExportsOfSymbol(symbol);
      var typeSymbol = exportsSymbol && getSymbol(exportsSymbol, namedType.name, ts.SymbolFlags.Type);
      var type = typeSymbol && getDeclaredTypeOfSymbol(typeSymbol);
      return type || unknownType;
    }

    function getEffectiveGraphQLCallArguments(node: TaggedTemplateExpression) {
      if (!ts.graphQLSchema || !ts.isIdentifier(node.tag)) {
        return;
      }

      var tag = node.tag.escapedText.toString().trim();

      if (tag !== "gql" && tag !== "query" && tag !== "mutation") {
        return;
      }

      var template = node.template;
      var query = "";
      var args = "";
      var graphql = ts.graphql;
      var graphQLSchema = ts.graphQLSchema;

      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        query = template.text;
      } else {
        query = template.head.text;

        for (var i = 0, templateSpans = template.templateSpans, len = templateSpans.length; i < len; i++) {
          query += `$_${i} ${templateSpans[i].literal.text}`;
          args += `$_${i}:Unknown`;
        }
      }

      if (tag === "query") {
        if (args) {
          query = `query(${args}){${query}}`;
        } else {
          query = `{${query}}`;
        }
      } else if (tag === "mutation") {
        if (args) {
          query = `mutation(${args}){${query}}`;
        } else {
          query = `mutation{${query}}`;
        }
      }

      if (tag === "query" || tag === "mutation") {
        var documentNode = graphql.parse(query);
        var errors = graphql.validate(graphQLSchema, documentNode);

        for (var i = 0, len = errors.length; i < len; i++) {
          var match = errors[i].message.match(
            /^Variable ".*?" of type "Unknown" used in position expecting type "(.*?)"\.$/,
          );

          if (match) {
            query = query.replace("Unknown", match[1]);
          } else {
            return;
          }
        }
      }

      var documentNode = graphql.parse(query);
      var errors = graphql.validate(graphQLSchema, documentNode);

      if (errors.length) {
        return;
      }

      var operationDefinition: OperationDefinitionNode | undefined;

      for (var i = 0, definitions = documentNode.definitions, len = definitions.length; i < len; i++) {
        var definition = definitions[i];

        if (definition.kind === "OperationDefinition") {
          if (operationDefinition) {
            return;
          }

          operationDefinition = definition;
        }
      }

      if (!operationDefinition) {
        return;
      }

      var typeInfo = new graphql.TypeInfo(graphQLSchema);
      var values: Type[] = [];
      var variables: Symbol[] = [];
      var symbols: Symbol[] = [];
      var symbolsMap = new Map<readonly SelectionNode[], Symbol[]>();

      var createSymbolTable = ts.createSymbolTable;
      var emptyArray = ts.emptyArray;

      graphql.visit(
        operationDefinition,
        graphql.visitWithTypeInfo(typeInfo, {
          VariableDefinition(node) {
            var variableName = node.variable.name.value;
            var inputType = typeInfo.getInputType()!;
            var nullableType = graphql.getNullableType(inputType);
            var namedType = graphql.getNamedType(nullableType);
            var type = getTypescriptType(namedType);

            if (graphql.isListType(nullableType)) {
              type = createArrayType(type);
            }

            if (graphql.isNullableType(inputType)) {
              type = getUnionType([type, nullType]);
            }

            var symbol = createPropertySymbolWithType(variableName, type);
            values.push(type);
            variables.push(symbol);
          },
          Field: {
            enter(node, _key, parent: any) {
              if (node.selectionSet) {
                symbolsMap.set(node.selectionSet.selections, []);
                return;
              }

              var parentSymbols = symbolsMap.get(parent) || symbols;
              var fieldName = (node.alias || node.name).value;

              var outputType = typeInfo.getType()!;
              var namedType = graphql.getNamedType(outputType);
              var type = getTypescriptType(namedType);

              if (graphql.isNullableType(outputType)) {
                type = getUnionType([type, nullType]);
              }

              var symbol = createPropertySymbolWithType(fieldName, type);
              parentSymbols.push(symbol);
              return false;
            },
            leave(node, _key, parent: any) {
              var parentSymbols = symbolsMap.get(parent) || symbols;
              var fieldName = (node.alias || node.name).value;
              var outputType = typeInfo.getType()!;
              var nullableType = graphql.getNullableType(outputType);
              var selectionSymbols = symbolsMap.get(node.selectionSet!.selections)!;
              var selectionSymbolTable = createSymbolTable(selectionSymbols);
              var type = createAnonymousType(
                undefined,
                selectionSymbolTable,
                emptyArray,
                emptyArray,
                undefined,
                undefined,
              );

              if (graphql.isListType(nullableType)) {
                type = createArrayType(type);
              }

              if (graphql.isNullableType(outputType)) {
                type = getUnionType([type, nullType]);
              }

              var symbol = createPropertySymbolWithType(fieldName, type);
              parentSymbols.push(symbol);
            },
          },
        }),
      );

      var valuesSymbol = createPropertySymbolWithType("_values", createTupleType(values, undefined));

      var variablesSymbol = createPropertySymbolWithType(
        "_variables",
        createAnonymousType(undefined, createSymbolTable(variables), emptyArray, emptyArray, undefined, undefined),
      );

      var resultSymbol = createPropertySymbolWithType(
        "_result",
        createAnonymousType(undefined, createSymbolTable(symbols), emptyArray, emptyArray, undefined, undefined),
      );

      var expressions: Expression[] = [];

      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        var arrayType = createTupleType([getLiteralType(template.text)], undefined, true);

        var rawSymbol = createPropertySymbolWithType(
          "raw",
          createTupleType([getLiteralType(template.rawText)], undefined, true),
        );

        var symbolTable = createSymbolTable([rawSymbol, valuesSymbol, variablesSymbol, resultSymbol]);
        var objectType = createAnonymousType(undefined, symbolTable, emptyArray, emptyArray, undefined, undefined);
        var stringsType = getIntersectionType([arrayType, objectType]);
        expressions.push(createSyntheticExpression(template, stringsType));
      } else {
        var texts = [getLiteralType(template.head.text)];
        var rawTexts = [getLiteralType(template.head.rawText)];

        for (var i = 0, templateSpans = template.templateSpans, len = templateSpans.length; i < len; i++) {
          var span = templateSpans[i];
          texts.push(getLiteralType(span.literal.text));
          rawTexts.push(getLiteralType(span.literal.rawText));
          expressions.push(span.expression);
        }

        var arrayType = createTupleType(texts, undefined, true);
        var rawSymbol = createPropertySymbolWithType("raw", createTupleType(rawTexts, undefined, true));
        var symbolTable = createSymbolTable([rawSymbol, valuesSymbol, variablesSymbol, resultSymbol]);
        var objectType = createAnonymousType(undefined, symbolTable, emptyArray, emptyArray, undefined, undefined);
        var stringsType = getIntersectionType([arrayType, objectType]);
        expressions.unshift(createSyntheticExpression(template, stringsType));
      }

      return expressions;
    }

    function getEffectiveCallArguments(node: TaggedTemplateExpression) {
      try {
        var args = getEffectiveGraphQLCallArguments(node);

        if (args) {
          return args;
        }
      } catch (err) {}
    }
  };

  await Promise.all(
    typescriptPaths.map(async (path) => {
      const code = await readFile(copyPath(path), "utf-8");
      const _code = replaceUseStrictCode(code);

      if (code === _code) {
        throw new Error(`Not found "use strict"; ${path}`);
      }

      const __code = replaceGetEffectiveCallArguments(_code);

      if (_code === __code) {
        throw new Error(`Not found getEffectiveCallArguments ${path}`);
      }

      await writeFile(path, __code);
    }),
  );

  await writeFile(patchPath, hash);
};
