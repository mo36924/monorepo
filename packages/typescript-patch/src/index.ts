import { constants, copyFileSync, readFileSync, writeFileSync } from "fs";
import { DocumentNode, GraphQLInputType, GraphQLNamedType, GraphQLSchema } from "graphql";
import typescript, { LanguageService, Node, SourceFile, TaggedTemplateExpression } from "typescript";

declare const ts: typeof typescript;

export default () => {
  for (const name of ["tsc.js", "tsserver.js", "tsserverlibrary.js", "typescript.js", "typescriptServices.js"]) {
    const src = new URL(`../../../typescript/lib/${name}`, import.meta.url);
    const dest = new URL(`${name}_`, src);

    try {
      copyFileSync(src, dest, constants.COPYFILE_EXCL);
    } catch {}

    let data = readFileSync(dest, "utf8");

    for (const fn of [replaceUseStrict, replaceCreateLanguageService, replaceGetEffectiveCallArguments]) {
      if (name === "tsc.js" && fn === replaceCreateLanguageService) {
        continue;
      }

      const _data = data;
      data = fn(_data);

      if (_data === data) {
        throw new Error("Not found search value.");
      }
    }

    writeFileSync(src, data);
  }
};

const replaces: { [key: string]: string | undefined } = Object.assign(
  Object.create(null),
  Object.fromEntries(
    ["ScriptElementKind", "DiagnosticCategory", "SymbolFlags"].flatMap((prop) =>
      Object.keys((ts as any)[prop])
        .filter((key) => !/^-?\d+$/.test(key))
        .map((key) => [`ts.${prop}.${key}`, JSON.stringify((ts as any)[prop][key])]),
    ),
  ),
);

const getFunctionCode = (fn: Function) => {
  const code = fn.toString().replace(/ts\.\w+\.\w+/g, (m) => replaces[m] ?? m);
  return code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
};

const replaceUseStrict = (code: string) => code.replace('"use strict";', (m) => m + getFunctionCode(useStrict));

/* eslint-disable no-var */
const useStrict = () => {
  var ts;

  (function (ts) {
    try {
      const { mkdirSync, writeFileSync }: typeof import("fs") = require("fs");
      const { dirname, join }: typeof import("path") = require("path");
      const { config }: typeof import("@mo36924/graphql-config") = require("@mo36924/graphql-config");
      const { cwd, schema, declaration } = config();
      (ts as any)._ = { schema };
      const declarationPath = join(cwd, "node_modules/@types/_graphql/index.d.ts");
      mkdirSync(dirname(declarationPath), { recursive: true });
      writeFileSync(declarationPath, declaration);
    } catch {}
  })(ts || (ts = {}));
};

const replaceCreateLanguageService = (code: string) =>
  code.replace("ts.createLanguageService = createLanguageService;", () => getFunctionCode(_createLanguageService));

declare const createLanguageService: typeof ts.createLanguageService;

const _createLanguageService = () => {
  ts.createLanguageService = (host, documentRegistry, syntaxOnlyOrLanguageServiceMode) => {
    try {
      const schema: GraphQLSchema = (ts as any)._.schema;

      const { GraphQLError, parse, TypeInfo, visit, visitWithTypeInfo }: typeof import("graphql") = require("graphql");

      const {
        getAutocompleteSuggestions,
        getDiagnostics,
        getHoverInformation,
        getTokenAtPosition,
      }: typeof import("graphql-language-service-interface") = require("graphql-language-service-interface");

      const { Position }: typeof import("graphql-language-service-utils") = require("graphql-language-service-utils");

      const {
        CompletionItemKind,
        DiagnosticSeverity,
      }: typeof import("vscode-languageserver-types") = require("vscode-languageserver-types");

      const isGraphqlTag = (tag: string) => {
        switch (tag) {
          case "gql":
          case "query":
          case "mutation":
          case "subscription":
          case "useQuery":
          case "useMutation":
          case "useSubscription":
            return true;
          default:
            return false;
        }
      };

      const getDiagnosticCategory = (severity?: number) => {
        switch (severity) {
          case DiagnosticSeverity.Error:
            return ts.DiagnosticCategory.Error;
          case DiagnosticSeverity.Warning:
            return ts.DiagnosticCategory.Warning;
          case DiagnosticSeverity.Information:
            return ts.DiagnosticCategory.Message;
          case DiagnosticSeverity.Hint:
            return ts.DiagnosticCategory.Suggestion;
          default:
            return ts.DiagnosticCategory.Error;
        }
      };

      const hover = (sourceFile: SourceFile, position: number) => {
        const tag = ts.forEachChild(sourceFile, function visitor(node): true | undefined | TaggedTemplateExpression {
          if (position < node.pos) {
            return true;
          }

          if (position >= node.end) {
            return;
          }

          if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.getText())) {
            const template = node.template;

            if (ts.isNoSubstitutionTemplateLiteral(template)) {
              if (position >= template.getStart() + 1 && position < template.getEnd() - 1) {
                return node;
              }
            } else {
              const head = template.head;

              if (position >= head.getStart() + 1 && position < head.getEnd() - 2) {
                return node;
              }

              for (const { literal } of template.templateSpans) {
                if (
                  position >= literal.getStart() + 1 &&
                  position < literal.getEnd() - (ts.isTemplateMiddle(literal) ? 2 : 1)
                ) {
                  return node;
                }
              }
            }
          }

          return ts.forEachChild(node, visitor);
        });

        if (tag === true) {
          return;
        }

        return tag;
      };

      const buildQuery = (node: TaggedTemplateExpression) => {
        const template = node.template;
        let query = "";

        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          // 2 \`\`
          const templateWidth = template.getWidth() - 2;
          query = template.text.padStart(templateWidth);
        } else {
          const head = template.head;
          const templateSpans = template.templateSpans;

          // 3 \`...\${
          const templateWidth = head.getWidth() - 3;
          query = head.text.padStart(templateWidth);

          templateSpans.forEach((span, i) => {
            const spanWidth = span.getFullWidth();
            const literal = span.literal;
            const literalWidth = literal.getWidth();
            const expressionWidth = spanWidth - literalWidth;
            const variableName = `$_${i}`;
            const variable = variableName.padStart(expressionWidth + 2).padEnd(expressionWidth + 3);
            const templateWidth = literalWidth - (ts.isTemplateTail(literal) ? 2 : 3);
            const template = literal.text.padStart(templateWidth);
            query += variable + template;
          });
        }

        const tag = node.tag.getText();
        let _query = query;

        if (tag !== "query") {
          _query = tag + _query;
        }

        const documentNode = parse(_query);
        const inputTypes: GraphQLInputType[] = [];
        const typeInfo = new TypeInfo(schema);

        visit(
          documentNode,
          visitWithTypeInfo(typeInfo, {
            Variable() {
              inputTypes.push(typeInfo.getInputType()!);
            },
          }),
        );

        query = query.replace(/\n|\r/g, " ");
        let offset = template.getStart() + 1;

        if (inputTypes.length) {
          const variables = `(${inputTypes.map((value, i) => `$_${i}:${value}`).join()})`;
          query = tag + variables + query;
          offset -= tag.length + variables.length;
        } else if (tag !== "query") {
          query = tag + query;
          offset -= tag.length;
        }

        return {
          query,
          offset,
        };
      };

      const languageService = createLanguageService(host, documentRegistry, syntaxOnlyOrLanguageServiceMode);
      const getSourceFile = (fileName: string) => languageService.getProgram()?.getSourceFile(fileName);
      const proxy: LanguageService = Object.create(null);

      for (const [key, value] of Object.entries(languageService)) {
        (proxy as any)[key] = value.bind(languageService);
      }

      proxy.getQuickInfoAtPosition = (fileName, position) => {
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return undefined;
        }

        const tag = hover(sourceFile, position);

        if (!tag) {
          return languageService.getQuickInfoAtPosition(fileName, position);
        }

        let result;

        try {
          result = buildQuery(tag);
        } catch {
          return languageService.getQuickInfoAtPosition(fileName, position);
        }

        const { query, offset } = result;
        const cursor = new Position(0, position - offset + 1);
        const token = getTokenAtPosition(query, cursor);
        const marked = getHoverInformation(schema, query, cursor, token);

        if (marked === "" || typeof marked !== "string") {
          return;
        }

        return {
          kind: ts.ScriptElementKind.string,
          textSpan: {
            start: offset + token.start,
            length: token.end - token.start,
          },
          kindModifiers: "",
          displayParts: [{ text: marked, kind: "" }],
        };
      };

      proxy.getCompletionsAtPosition = (fileName, position, options) => {
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return undefined;
        }

        const tag = hover(sourceFile, position);

        if (!tag) {
          return languageService.getCompletionsAtPosition(fileName, position, options);
        }

        let result;

        try {
          result = buildQuery(tag);
        } catch {
          return languageService.getCompletionsAtPosition(fileName, position, options);
        }

        const { query, offset } = result;
        const cursor = new Position(0, position - offset);
        const items = getAutocompleteSuggestions(schema, query, cursor);

        if (!items.length) {
          return;
        }

        return {
          isGlobalCompletion: false,
          isMemberCompletion: false,
          isNewIdentifierLocation: false,
          entries: items.map((item) => {
            let kind;

            switch (item.kind) {
              case CompletionItemKind.Function:
              case CompletionItemKind.Constructor:
                kind = ts.ScriptElementKind.functionElement;
                break;
              case CompletionItemKind.Field:
              case CompletionItemKind.Variable:
                kind = ts.ScriptElementKind.memberVariableElement;
                break;
              default:
                kind = ts.ScriptElementKind.unknown;
                break;
            }

            return {
              name: item.label,
              kindModifiers: "",
              kind,
              sortText: "",
            };
          }),
        };
      };

      proxy.getSemanticDiagnostics = (fileName) => {
        const diagnostics = languageService.getSemanticDiagnostics(fileName);
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return diagnostics;
        }

        ts.forEachChild(sourceFile, function visitor(node) {
          if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.getText())) {
            try {
              const { query, offset } = buildQuery(node);
              const _diagnostics = getDiagnostics(query, schema);

              for (const {
                range: { start, end },
                severity,
                message,
              } of _diagnostics) {
                diagnostics.push({
                  category: getDiagnosticCategory(severity),
                  code: 9999,
                  messageText: message,
                  file: sourceFile,
                  start: start.character + offset,
                  length: end.character - start.character,
                });
              }
            } catch (error) {
              if (error instanceof GraphQLError) {
                diagnostics.push({
                  category: ts.DiagnosticCategory.Error,
                  code: 9999,
                  messageText: error.message,
                  file: sourceFile,
                  start: node.template.getStart() + 1,
                  length: node.template.getWidth() - 2,
                });
              }
            }
          }

          ts.forEachChild(node, visitor);
        });

        return diagnostics;
      };

      return proxy;
    } catch {
      return createLanguageService(host, documentRegistry, syntaxOnlyOrLanguageServiceMode);
    }
  };
};

const replaceGetEffectiveCallArguments = (code: string) =>
  code.replace("function getEffectiveCallArguments(node) {", (m) => m + getFunctionCode(getEffectiveCallArguments));

declare const {
  createSymbol,
  createAnonymousType,
  stringType,
  numberType,
  booleanType,
  getGlobalType,
  unknownType,
  getGlobalSymbol,
  getExportsOfSymbol,
  getSymbol,
  getDeclaredTypeOfSymbol,
  createArrayType,
  getUnionType,
  nullType,
  createTupleType,
  getIntersectionType,
  getGlobalTemplateStringsArrayType,
  createSyntheticExpression,
}: any;

const getEffectiveCallArguments = (node: Node) => {
  try {
    const isGraphqlTag = (tag: string) => {
      switch (tag) {
        case "gql":
        case "query":
        case "mutation":
        case "subscription":
        case "useQuery":
        case "useMutation":
        case "useSubscription":
          return true;
        default:
          return false;
      }
    };

    if (
      ts.isTaggedTemplateExpression(node) &&
      ts.isIdentifier(node.tag) &&
      isGraphqlTag(node.tag.escapedText as string)
    ) {
      const schema: GraphQLSchema = (ts as any)._.schema;

      const {
        parse,
        validate,
        TypeInfo,
        visit,
        visitWithTypeInfo,
        getNullableType,
        getNamedType,
        isScalarType,
        isListType,
        isNullableType,
        specifiedRules,
        NoUndefinedVariablesRule,
      }: typeof import("graphql") = require("graphql");

      const createPropertySymbolWithType = (name: string, type: any, readonly?: boolean) => {
        const symbol = createSymbol(ts.SymbolFlags.Property, name, readonly ? 8 : 0);
        symbol.type = type;
        return symbol;
      };

      const createPropertiesType = (symbolTable: any) => {
        const type = createAnonymousType(
          undefined,
          symbolTable,
          (ts as any).emptyArray,
          (ts as any).emptyArray,
          (ts as any).emptyArray,
        );

        return type;
      };

      const getTypescriptType = (namedType: GraphQLNamedType) => {
        const isScalar = isScalarType(namedType);
        const name = namedType.name;

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
              return unknownType;
          }
        }

        const symbol = getGlobalSymbol("GraphQL", ts.SymbolFlags.Namespace);
        const exportsSymbol = symbol && getExportsOfSymbol(symbol);
        const typeSymbol = exportsSymbol && getSymbol(exportsSymbol, namedType.name, ts.SymbolFlags.Type);
        const type = typeSymbol && getDeclaredTypeOfSymbol(typeSymbol);
        return type || unknownType;
      };

      const {
        template,
        tag: { escapedText: tag },
      } = node;

      let query = "";

      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        query += template.text;
      } else {
        query += template.head.text;

        template.templateSpans.forEach((span, i) => {
          query += `$_${i}${span.literal.text}`;
        });
      }

      if (tag !== "query") {
        query = tag + query;
      }

      let documentNode: DocumentNode;

      try {
        documentNode = parse(query);
      } catch {
        throw 0;
      }

      const errors = validate(
        schema,
        documentNode,
        specifiedRules.filter((specifiedRule) => specifiedRule !== NoUndefinedVariablesRule),
      );

      if (errors.length) {
        throw 0;
      }

      const typeInfo = new TypeInfo(schema);
      const values: any[] = [];
      const variables: any[] = [];
      const symbols: any[] = [];
      const symbolsMap = new Map();
      const createSymbolTable = (ts as any).createSymbolTable;
      let i = 0;

      visit(
        documentNode,
        visitWithTypeInfo(typeInfo, {
          Variable() {
            const variableName = `_${i++}`;
            const inputType = typeInfo.getInputType()!;
            const nullableType = getNullableType(inputType);
            const namedType = getNamedType(nullableType);
            let type = getTypescriptType(namedType);

            if (isListType(nullableType)) {
              type = createArrayType(type);
            }

            if (isNullableType(inputType)) {
              type = getUnionType([type, nullType]);
            }

            const symbol = createPropertySymbolWithType(variableName, type);
            values.push(type);
            variables.push(symbol);
          },
          Field: {
            enter(node, _key, parent) {
              if (node.selectionSet) {
                symbolsMap.set(node.selectionSet.selections, []);
                return;
              }

              const parentSymbols = symbolsMap.get(parent) || symbols;
              const fieldName = (node.alias || node.name).value;
              const outputType = typeInfo.getType()!;
              const namedType = getNamedType(outputType);
              let type = getTypescriptType(namedType);

              if (isNullableType(outputType)) {
                type = getUnionType([type, nullType]);
              }

              const symbol = createPropertySymbolWithType(fieldName, type);
              parentSymbols.push(symbol);
              return false;
            },
            leave(node, _key, parent) {
              const parentSymbols = symbolsMap.get(parent) || symbols;
              const fieldName = (node.alias || node.name).value;
              const outputType = typeInfo.getType()!;
              const nullableType = getNullableType(outputType);
              const selectionSymbols = symbolsMap.get(node.selectionSet!.selections);
              const selectionSymbolTable = createSymbolTable(selectionSymbols);
              let type = createPropertiesType(selectionSymbolTable);

              if (isListType(nullableType)) {
                type = createArrayType(type);
              }

              if (isNullableType(outputType)) {
                type = getUnionType([type, nullType]);
              }

              const symbol = createPropertySymbolWithType(fieldName, type);
              parentSymbols.push(symbol);
            },
          },
        }),
      );

      const valuesSymbol = createPropertySymbolWithType("values", createTupleType(values, undefined));

      const variablesSymbol = createPropertySymbolWithType(
        "variables",
        createPropertiesType(createSymbolTable(variables)),
      );

      const dataSymbol = createPropertySymbolWithType("data", createPropertiesType(createSymbolTable(symbols)));

      const graphqlSymbol = createPropertySymbolWithType(
        "graphql",
        createPropertiesType(createSymbolTable([valuesSymbol, variablesSymbol, dataSymbol])),
      );

      const graphqlTemplateStringsArrayType = getIntersectionType([
        getGlobalTemplateStringsArrayType(),
        createPropertiesType(createSymbolTable([graphqlSymbol])),
      ]);

      const args = [createSyntheticExpression(template, graphqlTemplateStringsArrayType)];

      if (ts.isTemplateExpression(template)) {
        template.templateSpans.forEach((span) => {
          args.push(span.expression);
        });
      }

      return args;
    }
  } catch {}
};
