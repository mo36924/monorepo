import { getFieldDefInfo } from "@mo36924/graphql-schema";
import type { GraphQLObjectType } from "graphql";
import type { MutationContext } from "./context";
import { Queries, sortQueries } from "./sort";
import {
  escape,
  escapedIdColumn,
  escapedIsDeletedColumn,
  escapedTrue,
  escapedUpdatedAtColumn,
  escapedVersionColumn,
  escapedVersionColumnIncrement,
  escapeId,
  escapeUUID,
} from "./util";

const pushDeleteQuery = (
  context: MutationContext,
  parentType: GraphQLObjectType,
  data: { [key: string]: any },
  queries: Queries,
) => {
  const { schema, ids, escapedDate } = context;
  const name = parentType.name;
  const { id, version } = data;
  const escapedId = escapeUUID(id);
  const wherePredicates = [`${escapedIdColumn}=${escapedId} and ${escapedVersionColumn}=${escape(version)}`];
  (ids[name] ??= []).push(id);

  for (const [key, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const info = getFieldDefInfo(schema, parentType, key);
    const directives = info.directives;

    if (directives.ref) {
      if (value) {
        wherePredicates.push(`${escapeId(key)}=${escape(value)}`);
      }

      continue;
    }

    if (info.scalar) {
      continue;
    }

    const type = info.type;

    if (directives.type) {
      const update = `update ${escapeId(
        directives.type.name,
      )} set ${escapedVersionColumn}=${escapedVersionColumnIncrement},${escapedUpdatedAtColumn}=${escapedDate},${escapedIsDeletedColumn}=${escapedTrue} where ${escapeId(
        directives.type.keys[0],
      )}=${escapedId} and ${escapeId(directives.type.keys[1])}=`;

      for (const data of value) {
        const _id = data.id;
        queries.push([directives.type.name, id < _id ? id : _id, `${update}${escape(_id)};`]);
        pushDeleteQuery(context, type, data, queries);
      }

      continue;
    }

    if (directives.key) {
      wherePredicates.push(`${escapeId(directives.key.name)}=${escape(value.id)}`);
      pushDeleteQuery(context, type, value, queries);
      continue;
    }

    if (directives.field) {
      if (info.list) {
        for (const data of value) {
          pushDeleteQuery(context, type, { ...data, [directives.field.key]: id }, queries);
        }
      } else {
        pushDeleteQuery(context, type, { ...value, [directives.field.key]: id }, queries);
      }

      continue;
    }
  }

  queries.push([
    name,
    id,
    `update ${escapeId(name)} set ${escapedVersionColumn}=${escape(
      version + 1,
    )},${escapedUpdatedAtColumn}=${escapedDate},${escapedIsDeletedColumn}=${escapedTrue} where ${wherePredicates.join(
      " and ",
    )};`,
  ]);
};

export const createDeleteQueries = (context: MutationContext, data: { [key: string]: any }) => {
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
        pushDeleteQuery(context, type as GraphQLObjectType, data, queries);
      }
    } else {
      pushDeleteQuery(context, type as GraphQLObjectType, value, queries);
    }
  }

  const sortedQueries = sortQueries(schema, queries);
  return sortedQueries;
};
