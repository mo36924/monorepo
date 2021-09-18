import { getFieldDefInfo } from "@mo36924/graphql-utilities";
import type { GraphQLObjectType } from "graphql";
import type { MutationContext } from "./context";
import { Queries, sortQueries } from "./sort";
import {
  baseColumns,
  escape,
  escapedIdColumn,
  escapedUpdatedAtColumn,
  escapedVersionColumn,
  escapedVersionColumnIncrement,
  escapeId,
  escapeUUID,
} from "./util";

const pushUpdateQuery = (
  context: MutationContext,
  parentType: GraphQLObjectType,
  data: { [key: string]: any },
  queries: Queries,
) => {
  const { schema, ids, escapedDate } = context;
  const name = parentType.name;
  const { id, version } = data;
  const escapedId = escapeUUID(id);
  const values: string[] = [`${escapedVersionColumn}=${escape(version + 1)},${escapedUpdatedAtColumn}=${escapedDate}`];

  const wherePredicates = new Set<string>([
    `${escapedIdColumn}=${escapedId} and ${escapedVersionColumn}=${escape(version)}`,
  ]);

  (ids[name] ??= []).push(id);

  for (const [key, value] of Object.entries(data)) {
    if (baseColumns.includes(key)) {
      continue;
    }

    const info = getFieldDefInfo(schema, parentType, key);
    const directives = info.directives;

    if (directives.ref) {
      if (value) {
        wherePredicates.add(`${escapeId(key)}=${escape(value)}`);
      }

      continue;
    }

    if (info.scalar) {
      values.push(`${escapeId(key)}=${escape(value)}`);
      continue;
    }

    if (value == null) {
      continue;
    }

    const type = info.type;

    if (directives.type) {
      const update = `update ${escapeId(
        directives.type.name,
      )} set ${escapedVersionColumn}=${escapedVersionColumnIncrement},${escapedUpdatedAtColumn}=${escapedDate} where ${escapeId(
        directives.type.keys[0],
      )}=${escapedId} and ${escapeId(directives.type.keys[1])}=`;

      for (const data of value) {
        const _id = data.id;
        queries.push([directives.type.name, id < _id ? id : _id, update + escape(_id)]);
        pushUpdateQuery(context, type, data, queries);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.add(`${escapeId(directives.key.name)}=${escape(value.id)}`);
      pushUpdateQuery(context, type, value, queries);
      continue;
    }

    if (directives.field) {
      if (info.list) {
        for (const data of value) {
          pushUpdateQuery(context, type, { ...data, [directives.field.key]: id }, queries);
        }
      } else {
        pushUpdateQuery(context, type, { ...value, [directives.field.key]: id }, queries);
      }

      continue;
    }
  }

  queries.push([
    name,
    id,
    `update ${escapeId(name)} set ${values.join()} where ${[...wherePredicates].join(" and ")};`,
  ]);
};

export const createUpdateQueries = (context: MutationContext, data: { [key: string]: any }) => {
  const queries: Queries = [];
  const schema = context.schema;
  const parentType = schema.getQueryType()!;

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldDefInfo(schema, parentType, key);

    if (list) {
      for (const data of value) {
        pushUpdateQuery(context, type as GraphQLObjectType, data, queries);
      }
    } else {
      pushUpdateQuery(context, type as GraphQLObjectType, value, queries);
    }
  }

  const sortedQueries = sortQueries(schema, queries);
  return sortedQueries;
};
