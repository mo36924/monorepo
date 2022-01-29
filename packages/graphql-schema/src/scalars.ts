import { GraphQLError, GraphQLScalarType, Kind, print } from "graphql";
import inspect from "graphql/jsutils/inspect";
import { validate } from "uuid";

export const primaryKeyTypeName = "UUID";
export const customScalarTypeNames = ["UUID", "Date"] as const;
export const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames] as const;
export type CustomScalarTypeNames = typeof customScalarTypeNames;
export type CustomScalarUnionTypeNames = CustomScalarTypeNames[number];
export type ScalarTypeNames = typeof scalarTypeNames;
export type ScalarUnionTypeNames = ScalarTypeNames[number];
export const customScalars = `
${customScalarTypeNames.map((name) => `scalar ${name}`).join("\n")}
`;
export const isScalarTypeName = (type: string): type is ScalarUnionTypeNames =>
  (scalarTypeNames as readonly string[]).includes(type);

const validateUUID = (uuid: any): string => {
  if (!validate(uuid)) {
    throw new GraphQLError("UUID cannot represent value: ".concat(inspect(uuid)), {});
  }

  return uuid;
};

export const GraphQLUUID = new GraphQLScalarType({
  name: "UUID",
  description: "The `UUID` scalar type represents a unique identifier.",
  serialize: validateUUID,
  parseValue: validateUUID,
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING) {
      throw new GraphQLError("UUID cannot represent a non string value: ".concat(print(valueNode)), {
        nodes: valueNode,
      });
    }

    return validateUUID(valueNode.value);
  },
});

export const GraphQLDate = new GraphQLScalarType({
  name: "Date",
  description: "The `Date` scalar type represents date value.",
  serialize(date) {
    if (date == null || !(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(date)), {});
    }

    return [0, date.toJSON()];
  },
  parseValue(value: any) {
    let date: Date;

    if (Array.isArray(value) && value.length === 2 && value[0] === 0 && typeof value[1] === "string") {
      const value1 = value[1];
      date = new Date(value1);

      if (value1 !== date.toJSON()) {
        throw new GraphQLError("Date cannot represent value: ".concat(inspect(value)), {});
      }
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(value)), {});
    }

    return date;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING) {
      throw new GraphQLError("Date cannot represent a non string value: ".concat(print(valueNode)), {
        nodes: valueNode,
      });
    }

    const date = new Date(valueNode.value);

    if (Number.isNaN(date.getTime())) {
      throw new GraphQLError("Date cannot represent value: ".concat(inspect(valueNode.value)), {});
    }

    return date;
  },
});

export const resolvers = { UUID: GraphQLUUID, Date: GraphQLDate };
