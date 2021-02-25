import type { Field } from "@mo36924/graphql-query";
import { buildSchemaTypes, Type, Types } from "@mo36924/graphql-schema";
import { escapeId, escape } from "@mo36924/postgres-escape";
import type { GraphQLSchema } from "graphql";
import { v4 as uuid } from "uuid";
import type { Context } from "./context";

export default (context: Required<Context>, schema: GraphQLSchema, field: Field) => {
  const types = buildSchemaTypes(schema);
  const queries: string[] = [];
  const date = new Date();

  for (const [key, value] of Object.entries(field.args.data)) {
    if (value == null) {
      continue;
    }

    const field = types.Query.fields[key];
    const returnType = types[field.type];
    const values = Array.isArray(value) ? value : [value];

    for (const _value of values) {
      query(context, types, returnType, { ..._value, id: uuid() }, queries, date);
    }
  }

  return queries;
};

const query = (
  context: Required<Context>,
  types: Types,
  type: Type,
  data: { [key: string]: any },
  queries: string[],
  date: Date,
) => {
  const columns: string[] = ['"id"', '"version"', '"createdAt"', '"updatedAt"', '"isDeleted"'];
  const values: string[] = [escape(data.id), "1", escape(date), escape(date), "FALSE"];
  const _queries: string[] = [];

  if (context.ids[type.name]) {
    context.ids[type.name].push(data.id);
  } else {
    context.ids[type.name] = [data.id];
  }

  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case "id":
      case "version":
      case "createdAt":
      case "updatedAt":
      case "isDeleted":
        continue;
    }

    const field = type.fields[key];

    if (field.scalar) {
      columns.push(escapeId(key));
      values.push(escape(value));
      continue;
    }

    if (value == null) {
      continue;
    }

    const directives = field.directives;
    const returnType = types[field.type];

    if (directives.type) {
      for (const _data of value) {
        const id = uuid();

        query(context, types, returnType, { ..._data, id }, _queries, date);

        _queries.push(
          `insert into ${escapeId(directives.type.name)} ("id",${escapeId(directives.type.keys[0])},${escapeId(
            directives.type.keys[1],
          )},"createdAt","updatedAt","isDeleted") values (${escape(uuid())},${escape(data.id)},${escape(id)},${escape(
            date,
          )},${escape(date)},FALSE)`,
        );
      }

      continue;
    }

    if (directives.key) {
      const id = uuid();
      columns.push(escapeId(directives.key.name));
      values.push(escape(id));
      query(context, types, returnType, { ...value, id }, queries, date);
      continue;
    }

    if (directives.field) {
      if (field.list) {
        for (const _value of value) {
          query(context, types, returnType, { ..._value, id: uuid(), [directives.field.key]: data.id }, _queries, date);
        }
      } else {
        query(context, types, returnType, { ...value, id: uuid(), [directives.field.key]: data.id }, _queries, date);
      }

      continue;
    }
  }

  queries.push(`insert into ${escapeId(type.name)} (${columns.join()}) values (${values.join()})`, ..._queries);
};
