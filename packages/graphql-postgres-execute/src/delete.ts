import { fieldDirectives } from "@mo36924/graphql-utils";
import { escape, escapeId } from "@mo36924/postgres-escape";
import {
  getNamedType,
  getNullableType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  isListType,
  isScalarType,
} from "graphql";
import type { Arguments } from "./arguments";
import type { Context } from "./context";
import sort, { Queries } from "./sort";

export default (_source: any, args: Arguments, context: Context, info: GraphQLResolveInfo) => {
  const schema = info.schema;
  const queryType = schema.getQueryType()!;
  const queries: Queries = [];

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
        query(_value, args, context, info, namedType, queries);
      }
    } else {
      query(value, args, context, info, namedType, queries);
    }
  }

  const sortedQueries = sort(schema, queries);
  return sortedQueries;
};

const query = (
  source: { [key: string]: any },
  args: Arguments,
  context: Context,
  info: GraphQLResolveInfo,
  type: GraphQLObjectType,
  queries: Queries,
) => {
  const ids = context.ids;
  const table = type.name;
  const fields = type.getFields();

  const wherePredicates = new Set<string>([
    `${escapeId("id")}=${escape(source.id)} and ${escapeId("version")}=${escape(source.version)}`,
  ]);

  if (ids[table]) {
    ids[table].push(source.id);
  } else {
    ids[table] = [source.id];
  }

  for (const [key, value] of Object.entries(source)) {
    if (value == null) {
      continue;
    }

    const field = fields[key];
    const returnType = field.type;
    const nullableType = getNullableType(returnType);
    const namedType: any = getNamedType(nullableType);
    const scalar = isScalarType(namedType);
    const directives = fieldDirectives(info.schema, field);

    if (directives.ref) {
      if (value) {
        wherePredicates.add(`${escapeId(key)}=${escape(value)}`);
      }

      continue;
    }

    if (scalar) {
      continue;
    }

    if (directives.type) {
      const { name, keys } = directives.type;

      for (const _value of value) {
        queries.push([
          name,
          source.id < _value.id ? source.id : _value.id,
          `update ${escapeId(name)} set ${escapeId("updatedAt")}=${escape(context.date)},${escapeId(
            "isDeleted",
          )}=${escape(true)} where ${escapeId(keys[0])}=${escape(source.id)} and ${escapeId(keys[1])}=${escape(
            _value.id,
          )}`,
        ]);

        query(_value, args, context, info, namedType, queries);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.add(`${escapeId(directives.key.name)}=${escape(value.id)}`);
      query(value, args, context, info, namedType, queries);
      continue;
    }

    if (directives.field) {
      const key = directives.field.key;
      const list = isListType(nullableType);

      if (list) {
        for (const _value of value) {
          query({ ..._value, [key]: source.id }, args, context, info, namedType, queries);
        }
      } else {
        query({ ...value, [key]: source.id }, args, context, info, namedType, queries);
      }

      continue;
    }
  }

  queries.push([
    table,
    source.id,
    `update ${escapeId(table)} set ${escapeId("version")}=${escape(source.version + 1)},${escapeId(
      "updatedAt",
    )}=${escape(context.date)},${escapeId("isDeleted")}=${escape(true)} where ${[...wherePredicates].join(" and ")}`,
  ]);
};
