import { getFieldInfo } from "@mo36924/graphql-utils";
import { escape, escapeId } from "@mo36924/postgres-escape";
import type { GraphQLObjectType } from "graphql";
import type { Context } from "./context";
import type { Data } from "./data";
import sort, { Queries } from "./sort";

export default (context: Required<Context>, data: Data) => {
  const queries: Queries = [];
  const schema = context.schema;
  const fields = schema.getQueryType()!.getFields();

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldInfo(schema, fields[key]);

    if (list) {
      for (const _value of value) {
        query(context, type, _value, queries);
      }
    } else {
      query(context, type, value, queries);
    }
  }

  const sortedQueries = sort(context.schema, queries);
  return sortedQueries;
};

const query = (context: Required<Context>, type: GraphQLObjectType, data: Data, queries: Queries) => {
  const { schema, ids, date } = context;
  const fields = type.getFields();
  const wherePredicates = new Set<string>([`"id"=${escape(data.id)} and "version"=${escape(data.version)}`]);

  if (ids[type.name]) {
    ids[type.name].push(data.id);
  } else {
    ids[type.name] = [data.id];
  }

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const fieldInfo = getFieldInfo(schema, fields[key]);
    const directives = fieldInfo.directives;

    if (directives.ref) {
      if (value) {
        wherePredicates.add(`${escapeId(key)}=${escape(value)}`);
      }

      continue;
    }

    if (fieldInfo.scalar) {
      continue;
    }

    const returnType = fieldInfo.type;

    if (directives.type) {
      for (const _data of value) {
        queries.push([
          directives.type.name,
          data.id < _data.id ? data.id : _data.id,
          `update ${escapeId(directives.type.name)} set "updatedAt"=${escape(date)},"isDeleted"=TRUE where ${escapeId(
            directives.type.keys[0],
          )}=${escape(data.id)} and ${escapeId(directives.type.keys[1])}=${escape(_data.id)}`,
        ]);

        query(context, returnType, _data, queries);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.add(`${escapeId(directives.key.name)}=${escape(value.id)}`);
      query(context, returnType, value, queries);
      continue;
    }

    if (directives.field) {
      if (fieldInfo.list) {
        for (const _value of value) {
          query(context, returnType, { ..._value, [directives.field.key]: data.id }, queries);
        }
      } else {
        query(context, returnType, { ...value, [directives.field.key]: data.id }, queries);
      }

      continue;
    }
  }

  queries.push([
    type.name,
    data.id,
    `update ${escapeId(type.name)} set "version"=${escape(data.version + 1)},"updatedAt"=${escape(
      date,
    )},"isDeleted"=TRUE where ${[...wherePredicates].join(" and ")}`,
  ]);
};
