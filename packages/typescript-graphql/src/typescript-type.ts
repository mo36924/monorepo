import type { GraphQLNamedType } from "graphql";
import type { default as typescript, TypeChecker } from "typescript";

export const getTypescriptType = (ts: typeof typescript, checker: TypeChecker, namedType: GraphQLNamedType) => {
  const symbol = checker.getGlobalSymbol("GraphQL", ts.SymbolFlags.Namespace);
  const _exports = symbol && checker.getExportsOfSymbol(symbol);
  const typeSymbol = _exports && checker.getSymbol(_exports, namedType.name, ts.SymbolFlags.Type);
  const type = (typeSymbol && checker.getDeclaredTypeOfSymbol(typeSymbol)) || checker.getUnknownType();
  return type;
};
