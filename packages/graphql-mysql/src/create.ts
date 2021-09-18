import { getFieldDefInfo } from "@mo36924/graphql-utilities";
import type { GraphQLObjectType } from "graphql";
import { v4 as uuid } from "uuid";
import type { MutationContext } from "./context";
import { baseColumns, escape, escaped1, escapedBaseColumns, escapedFalse, escapeId, escapeUUID } from "./util";

const pushCreateQuery = (
  context: MutationContext,
  parentType: GraphQLObjectType,
  data: { id: string; [key: string]: any },
  queries: string[],
) => {
  const { schema, ids, escapedDate } = context;
  const name = parentType.name;
  const id = data.id;
  const escapedId = escapeUUID(id);
  const columns = escapedBaseColumns.slice();
  const values: string[] = [escapedId, escaped1, escapedDate, escapedDate, escapedFalse];
  const _queries: string[] = [];
  (ids[name] ??= []).push(id);

  for (const [key, value] of Object.entries<any>(data)) {
    if (baseColumns.includes(key)) {
      continue;
    }

    const info = getFieldDefInfo(schema, parentType, key);

    if (info.scalar) {
      columns.push(escapeId(key));

      if (info.type.name === "UUID") {
        values.push(escapeUUID(value));
      } else {
        values.push(escape(value));
      }

      continue;
    }

    if (value == null) {
      continue;
    }

    const { directives, list, type } = info;

    if (directives.type) {
      const insert = `insert into ${escapeId(directives.type.name)} (${escapedBaseColumns.join()},${escapeId(
        directives.type.keys[0],
      )},${directives.type.keys[1]}) values `;

      for (const data of value) {
        const id = uuid();

        const _values = [
          escapeUUID(uuid()),
          escaped1,
          escapedDate,
          escapedDate,
          escapedFalse,
          escapedId,
          escapeUUID(id),
        ];

        pushCreateQuery(context, type, { ...data, id }, _queries);
        _queries.push(`${insert}(${_values.join()});`);
      }
    } else if (directives.key) {
      const id = uuid();
      columns.push(escapeId(directives.key.name));
      values.push(escapeUUID(id));
      pushCreateQuery(context, type, { ...value, id }, queries);
    } else if (directives.field) {
      if (list) {
        for (const data of value) {
          pushCreateQuery(context, type, { ...data, id: uuid(), [directives.field.key]: id }, _queries);
        }
      } else {
        pushCreateQuery(context, type, { ...value, id: uuid(), [directives.field.key]: id }, _queries);
      }
    }
  }

  queries.push(`insert into ${escapeId(name)} (${columns.join()}) values (${values.join()});`, ..._queries);
};

export const createInsertQueries = (context: MutationContext, data: { [key: string]: any }) => {
  const queries: string[] = [];
  const schema = context.schema;
  const parentType = schema.getQueryType()!;

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldDefInfo(schema, parentType, key);

    if (list) {
      for (const data of value) {
        pushCreateQuery(context, type as GraphQLObjectType, { ...data, id: uuid() }, queries);
      }
    } else {
      pushCreateQuery(context, type as GraphQLObjectType, { ...value, id: uuid() }, queries);
    }
  }

  return queries;
};
