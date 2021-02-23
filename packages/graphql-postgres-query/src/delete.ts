import type { Field } from "@mo36924/graphql-query";
import { buildSchemaTypes, Type, Types } from "@mo36924/graphql-schema";
import { escapeIdentifier, escapeLiteral } from "@mo36924/postgres-escape";
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
  const wherePredicates = new Set<string>([
    `"id"=${escapeLiteral(data.id)} and "version"=${escapeLiteral(data.version)}`,
  ]);

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
        wherePredicates.add(`${escapeIdentifier(key)}=${escapeLiteral(value)}`);
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
          `update ${escapeIdentifier(directives.type.name)} set "updatedAt"=${escapeLiteral(
            date,
          )},"isDeleted"=TRUE where ${escapeIdentifier(directives.type.keys[0])}=${escapeLiteral(
            data.id,
          )} and ${escapeIdentifier(directives.type.keys[1])}=${escapeLiteral(_data.id)}`,
        ]);

        query(context, types, returnType, _data, queries, date);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.add(`${escapeIdentifier(directives.key.name)}=${escapeLiteral(value.id)}`);
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
    `update ${escapeIdentifier(type.name)} set "version"=${escapeLiteral(data.version + 1)},"updatedAt"=${escapeLiteral(
      date,
    )},"isDeleted"=TRUE where ${[...wherePredicates].join(" and ")}`,
  ]);
};
