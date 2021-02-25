import {
  getNamedType,
  getNullableType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  isListType,
  isScalarType,
} from "graphql";
import { v4 as uuid } from "uuid";
import type { Arguments } from "./arguments";
import type { Context } from "./context";
import { fieldDirectives } from "./directives";

export default (_source: any, args: Arguments, context: Context, info: GraphQLResolveInfo) => {
  const schema = info.schema;
  const queryType = schema.getQueryType()!;
  const queries: string[] = [];

  for (const [key, value] of Object.entries<any>(args.data)) {
    if (value == null) {
      continue;
    }

    const fields = queryType.getFields();
    const returnType = fields[key].type;
    const nullableType = getNullableType(returnType);
    const namedType: any = getNamedType(nullableType);
    const isList = isListType(nullableType);

    if (isList) {
      for (const _value of value) {
        query({ ..._value, id: uuid() }, args, context, info, namedType, queries);
      }
    } else {
      query({ ...value, id: uuid() }, args, context, info, namedType, queries);
    }
  }

  return queries;
};

const query = (
  source: { [key: string]: any },
  args: Arguments,
  context: Context,
  info: GraphQLResolveInfo,
  type: GraphQLObjectType,
  queries: string[],
) => {
  const { escapeId, escape } = context;

  const columns: string[] = [
    escapeId("id"),
    escapeId("version"),
    escapeId("createdAt"),
    escapeId("updatedAt"),
    escapeId("isDeleted"),
  ];

  const values: string[] = [escape(source.id), escape("1"), escape(context.date), escape(context.date), escape(false)];
  const _queries: string[] = [];
  const fields = type.getFields();
  const ids = context.ids;
  const table = type.name;

  if (ids[table]) {
    ids[table].push(source.id);
  } else {
    ids[table] = [source.id];
  }

  for (const [key, value] of Object.entries(source)) {
    switch (key) {
      case "id":
      case "version":
      case "createdAt":
      case "updatedAt":
      case "isDeleted":
        continue;
    }

    const field = fields[key];
    const returnType = field.type;
    const nullableType = getNullableType(returnType);
    const namedType: any = getNamedType(nullableType);
    const scalar = isScalarType(namedType);

    if (scalar) {
      columns.push(escapeId(key));
      values.push(escape(value));
      continue;
    }

    if (value == null) {
      continue;
    }

    const directives = fieldDirectives(info.schema, field);

    if (directives.type) {
      const { name, keys } = directives.type;

      for (const _value of value) {
        const id = uuid();
        query({ ..._value, id }, args, context, info, namedType, _queries);

        _queries.push(
          `insert into ${escapeId(name)} (${escapeId("id")},${escapeId(keys[0])},${escapeId(keys[1])},${escapeId(
            "createdAt",
          )},${escapeId("updatedAt")},${escapeId("isDeleted")}) values (${escape(uuid())},${escape(source.id)},${escape(
            id,
          )},${escape(context.date)},${escape(context.date)},${escape(false)})`,
        );
      }

      continue;
    }

    if (directives.key) {
      const id = uuid();
      columns.push(escapeId(directives.key.name));
      values.push(escape(id));
      query({ ...value, id }, args, context, info, namedType, queries);
      continue;
    }

    if (directives.field) {
      const key = directives.field.key;
      const list = isListType(nullableType);

      if (list) {
        for (const _value of value) {
          query({ ..._value, id: uuid(), [key]: source.id }, args, context, info, namedType, _queries);
        }
      } else {
        query({ ...value, id: uuid(), [key]: source.id }, args, context, info, namedType, _queries);
      }

      continue;
    }
  }

  queries.push(`insert into ${escapeId(table)} (${columns.join()}) values (${values.join()})`, ..._queries);
};
