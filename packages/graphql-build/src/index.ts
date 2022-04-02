import {
  BuildSchemaOptions,
  DocumentNode,
  GraphQLError,
  GraphQLScalarTypeConfig,
  Kind,
  ObjectValueNode,
  ValueNode,
  buildASTSchema as _buildASTSchema,
  print,
} from "graphql";
import { inspect } from "graphql/jsutils/inspect";

const uuidRegExp =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

const validateUUID = (uuid: any): string => {
  if (typeof uuid === "string" && uuidRegExp.test(uuid)) {
    return uuid;
  }

  throw new GraphQLError("UUID cannot represent value: ".concat(inspect(uuid)), {});
};

const _Date: Partial<GraphQLScalarTypeConfig<Date, (string | number)[]>> = {
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
    if (valueNode.kind !== "StringValue") {
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
};

const _UUID: Partial<GraphQLScalarTypeConfig<string, string>> = {
  serialize: validateUUID,
  parseValue: validateUUID,
  parseLiteral(valueNode) {
    if (valueNode.kind !== "StringValue") {
      throw new GraphQLError("UUID cannot represent a non string value: ".concat(print(valueNode)), {
        nodes: valueNode,
      });
    }

    return validateUUID(valueNode.value);
  },
};

const parseObject = (ast: ObjectValueNode, variables: any): any => {
  const value = Object.create(null);

  ast.fields.forEach((field) => {
    value[field.name.value] = parseLiteral(field.value, variables);
  });

  return value;
};

const parseLiteral = (ast: ValueNode, variables: any): any => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast, variables);
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : undefined;
    }
  }
};

const _JSON: Partial<GraphQLScalarTypeConfig<any, any>> = {
  parseLiteral,
};

export const buildASTSchema = (documentAST: DocumentNode, options?: BuildSchemaOptions) => {
  const schema = _buildASTSchema(documentAST, options);
  const { Date, UUID, JSON } = schema.getTypeMap();
  Date && Object.assign(Date, _Date);
  UUID && Object.assign(UUID, _UUID);
  JSON && Object.assign(JSON, _JSON);
  return schema;
};
