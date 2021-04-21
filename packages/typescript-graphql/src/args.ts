import { memoize } from "@mo36924/memoize";
import {
  DocumentNode,
  getNamedType,
  getNullableType,
  GraphQLSchema,
  isListType,
  isNullableType,
  OperationDefinitionNode,
  SelectionNode,
  TypeInfo,
  visit,
  visitWithTypeInfo,
} from "graphql";
import type {
  default as typescript,
  Expression,
  Symbol,
  TaggedTemplateExpression,
  Type,
  TypeChecker,
} from "typescript";
import { getTypescriptType } from "./typescript-type";

const cache = memoize((_schema: GraphQLSchema) => new WeakMap<DocumentNode, Expression[] | undefined>(), new WeakMap());

export const getArgs = (
  ts: typeof typescript,
  schema: GraphQLSchema,
  node: TaggedTemplateExpression,
  checker: TypeChecker,
  documentNode: DocumentNode,
) => {
  const map = cache(schema);

  if (map.has(documentNode)) {
    return map.get(documentNode);
  }

  let operationDefinition: OperationDefinitionNode | undefined;

  for (const definition of documentNode.definitions) {
    if (definition.kind === "OperationDefinition") {
      if (operationDefinition === undefined) {
        operationDefinition = definition;
      } else {
        map.set(documentNode, undefined);
        return undefined;
      }
    }
  }

  if (operationDefinition === undefined) {
    map.set(documentNode, undefined);
    return undefined;
  }

  const {
    createTupleType,
    getLiteralType,
    createSymbolTable,
    createSymbol,
    createAnonymousType,
    emptyArray,
    getIntersectionType,
    createSyntheticExpression,
    createArrayType,
    getUnionType,
    getNullType,
  } = checker;

  const createPropertySymbolWithType = (name: string, type: Type, readonly?: boolean) => {
    const symbol: Symbol & { type?: Type } = createSymbol(ts.SymbolFlags.Property, name, readonly ? 8 : undefined);
    symbol.type = type;
    return symbol;
  };

  const typeInfo = new TypeInfo(schema);
  const values: Type[] = [];
  const variables: Symbol[] = [];
  const symbols: Symbol[] = [];
  const symbolsMap = new Map<readonly SelectionNode[], Symbol[]>();

  visit(
    operationDefinition,
    visitWithTypeInfo(typeInfo, {
      VariableDefinition(node) {
        const variableName = node.variable.name.value;
        const inputType = typeInfo.getInputType()!;
        const nullableType = getNullableType(inputType);
        const namedType = getNamedType(nullableType);
        let type = getTypescriptType(ts, checker, namedType);

        if (isListType(nullableType)) {
          type = createArrayType(type);
        }

        if (isNullableType(inputType)) {
          type = getUnionType([type, getNullType()]);
        }

        const symbol = createPropertySymbolWithType(variableName, type);
        values.push(type);
        variables.push(symbol);
      },
      Field: {
        enter(node, _key, parent: any) {
          if (node.selectionSet) {
            symbolsMap.set(node.selectionSet.selections, []);
            return;
          }

          const parentSymbols = symbolsMap.get(parent) || symbols;
          const fieldName = (node.alias ?? node.name).value;

          const outputType = typeInfo.getType()!;
          const namedType = getNamedType(outputType);
          let type = getTypescriptType(ts, checker, namedType);

          if (isNullableType(outputType)) {
            type = getUnionType([type, getNullType()]);
          }

          const symbol = createPropertySymbolWithType(fieldName, type);
          parentSymbols.push(symbol);
          return false;
        },
        leave(node, _key, parent: any) {
          const parentSymbols = symbolsMap.get(parent) || symbols;
          const fieldName = (node.alias ?? node.name).value;
          const outputType = typeInfo.getType()!;
          const nullableType = getNullableType(outputType);
          const selectionSymbols = symbolsMap.get(node.selectionSet!.selections)!;
          const selectionSymbolTable = createSymbolTable(selectionSymbols);
          let type = createAnonymousType(undefined, selectionSymbolTable, emptyArray, emptyArray, undefined, undefined);

          if (isListType(nullableType)) {
            type = createArrayType(type);
          }

          if (isNullableType(outputType)) {
            type = getUnionType([type, getNullType()]);
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
    createAnonymousType(undefined, createSymbolTable(variables), emptyArray, emptyArray, undefined, undefined),
  );

  const resultSymbol = createPropertySymbolWithType(
    "result",
    createAnonymousType(undefined, createSymbolTable(symbols), emptyArray, emptyArray, undefined, undefined),
  );

  const template = node.template;
  const args: Expression[] = [];

  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    const arrayType = createTupleType([getLiteralType(template.text)], undefined, true);

    const rawSymbol = createPropertySymbolWithType(
      "raw",
      createTupleType([getLiteralType(template.rawText)], undefined, true),
      true,
    );

    const symbolTable = createSymbolTable([rawSymbol, valuesSymbol, variablesSymbol, resultSymbol]);
    const objectType = createAnonymousType(undefined, symbolTable, emptyArray, emptyArray, undefined, undefined);
    const stringsType = getIntersectionType([arrayType, objectType]);
    args.push(createSyntheticExpression(template, stringsType));
  } else {
    const texts = [getLiteralType(template.head.text)];
    const rawTexts = [getLiteralType(template.head.rawText)];

    for (const span of template.templateSpans) {
      texts.push(getLiteralType(span.literal.text));
      rawTexts.push(getLiteralType(span.literal.rawText));
      args.push(span.expression);
    }

    const arrayType = createTupleType(texts, undefined, true);
    const rawSymbol = createPropertySymbolWithType("raw", createTupleType(rawTexts, undefined, true), true);
    const symbolTable = createSymbolTable([rawSymbol, valuesSymbol, variablesSymbol, resultSymbol]);
    const objectType = createAnonymousType(undefined, symbolTable, emptyArray, emptyArray, undefined, undefined);
    const stringsType = getIntersectionType([arrayType, objectType]);
    args.unshift(createSyntheticExpression(template, stringsType));
  }

  map.set(documentNode, args);
  return args;
};
