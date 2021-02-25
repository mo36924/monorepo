import type { Field } from "@mo36924/graphql-query";
import { buildSchemaTypes, Type, Types } from "@mo36924/graphql-schema";
import { escapeId, escape } from "@mo36924/postgres-escape";
import type { GraphQLSchema } from "graphql";
import type { Context } from "./context";
import sort, { Queries } from "./sort";

export default (context: Required<Context>, schema: GraphQLSchema, field: Field) => {
  const types = buildSchemaTypes(schema);
  const queries: Queries = [];
  const date = new Date();

  for (const [key, value] of Object.entries(field.args.data)) {
    if (value == null) {
      continue;
    }

    const field = types.Query.fields[key];
    const returnType = types[field.type];
    const values = Array.isArray(value) ? value : [value];

    for (const _value of values) {
      query(context, types, returnType, _value, queries, date);
    }
  }

  const sortedQueries = sort(types, queries);
  return sortedQueries;
};

const query = (
  context: Required<Context>,
  types: Types,
  type: Type,
  data: { [key: string]: any },
  queries: Queries,
  date: Date,
) => {
  const wherePredicates = new Set<string>([`"id"=${escape(data.id)} and "version"=${escape(data.version)}`]);

  if (context.ids[type.name]) {
    context.ids[type.name].push(data.id);
  } else {
    context.ids[type.name] = [data.id];
  }

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const field = type.fields[key];
    const directives = field.directives;

    if (directives.ref) {
      if (value) {
        wherePredicates.add(`${escapeId(key)}=${escape(value)}`);
      }

      continue;
    }

    if (field.scalar) {
      continue;
    }

    const returnType = types[field.type];

    if (directives.type) {
      for (const _data of value) {
        queries.push([
          directives.type.name,
          data.id < _data.id ? data.id : _data.id,
          `update ${escapeId(directives.type.name)} set "updatedAt"=${escape(date)},"isDeleted"=TRUE where ${escapeId(
            directives.type.keys[0],
          )}=${escape(data.id)} and ${escapeId(directives.type.keys[1])}=${escape(_data.id)}`,
        ]);

        query(context, types, returnType, _data, queries, date);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.add(`${escapeId(directives.key.name)}=${escape(value.id)}`);
      query(context, types, returnType, value, queries, date);
      continue;
    }

    if (directives.field) {
      if (field.list) {
        for (const _value of value) {
          query(context, types, returnType, { ..._value, [directives.field.key]: data.id }, queries, date);
        }
      } else {
        query(context, types, returnType, { ...value, [directives.field.key]: data.id }, queries, date);
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
