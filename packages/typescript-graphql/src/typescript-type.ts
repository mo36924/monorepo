import type { GraphQLNamedType } from "graphql";
import { SymbolFlags, TypeChecker } from "typescript";

export const getTypescriptType = (checker: TypeChecker, namedType: GraphQLNamedType) => {
  const symbol = checker.getGlobalSymbol("GraphQL", SymbolFlags.Namespace);
  const _exports = symbol && checker.getExportsOfSymbol(symbol);
  const typeSymbol = _exports && checker.getSymbol(_exports, namedType.name, SymbolFlags.Type);
  const type = (typeSymbol && checker.getDeclaredTypeOfSymbol(typeSymbol)) || checker.getUnknownType();
  return type;
};
