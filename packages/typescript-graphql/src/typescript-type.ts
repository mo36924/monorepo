import type { Checker } from "@mo36924/typescript-patch";
import { GraphQLNamedType, isScalarType } from "graphql";

export const getTypescriptType = (checker: Checker, namedType: GraphQLNamedType) => {
  if (!isScalarType(namedType)) {
    switch (namedType.name) {
      case "ID":
      case "String":
        return checker.getStringType();
      case "Int":
      case "Float":
        return checker.getNumberType();
      case "Boolean":
        return checker.getBooleanType();
      case "Date":
        return checker.getGlobalType("Date");
      default:
        return checker.getNeverType();
    }
  } else {
    return checker.getPropertyOfType(checker.getGlobalType("GraphQL"), namedType.name);
  }
};
