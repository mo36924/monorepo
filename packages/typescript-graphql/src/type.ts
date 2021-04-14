import type { Checker } from "@mo36924/typescript-patch";
import { GraphQLNamedType, isScalarType } from "graphql";

export const getType = (checker: Checker, namedType: GraphQLNamedType) => {
  const { getStringType, getNumberType, getBooleanType, getNeverType, getPropertyOfType, getGlobalType } = checker;
  const typeName = namedType.name;
  let type: any;

  if (isScalarType(namedType)) {
    switch (typeName) {
      case "ID":
      case "String":
        type = getStringType();
        break;
      case "Int":
      case "Float":
        type = getNumberType();
        break;
      case "Boolean":
        type = getBooleanType();
        break;
      case "Date":
        type = getGlobalType("Date");
        break;
      default:
        type = getNeverType();
        break;
    }
  } else {
    type = getPropertyOfType(getGlobalType("GraphQL"), typeName);
  }

  return type;
};
