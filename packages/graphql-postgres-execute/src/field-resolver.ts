import { infoDirectives } from "@mo36924/graphql-utils";
import { escape, escapeId } from "@mo36924/postgres-escape";
import { getNamedType, getNullableType, GraphQLResolveInfo, isListType, isScalarType } from "graphql";
import type { Arguments } from "./arguments";
import type { Context } from "./context";
import mutation from "./mutation";
import order from "./order";
import where from "./where";

export default async (source: any, args: Arguments, context: Context, info: GraphQLResolveInfo) => {
  if (info.parentType === info.schema.getMutationType()) {
    await mutation(source, args, context, info);
  }

  const nullableType = getNullableType(info.returnType);
  const namedType = getNamedType(nullableType);

  if (isScalarType(namedType)) {
    return source[info.fieldName];
  }

  const db = context.db;
  const directives = infoDirectives(info);
  const predicates: string[] = [];

  if (directives.type) {
    const { name, keys } = directives.type;

    const results = await db(
      `select ${escapeId(keys[1])} from ${escapeId(name)} where ${escapeId(keys[0])} = ${escape(source.id)}`,
    );

    if (results.rows.length === 0) {
      return [];
    }

    const ids: any[] = [];

    for (const result of results.rows) {
      if (result[keys[1]] != null) {
        ids.push(escape(result[keys[1]]));
      }
    }

    predicates.push(`${escapeId("id")} in (${ids.join()})`);
  } else if (directives.field) {
    predicates.push(`${escapeId(directives.field.key)} = ${escape(source.id)}`);
  } else if (directives.key) {
    predicates.push(`${escapeId("id")} = ${escape(source[directives.key.name])}`);
  }

  const list = isListType(nullableType);
  let query = `select * from ${escapeId(namedType.name)}`;

  const wherePredicates = where(context, args.where);

  if (wherePredicates) {
    predicates.push(`${wherePredicates}`);
  }

  if (predicates.length) {
    query += ` where ${predicates.join(" and ")}`;
  }

  const orderPredicates = order(context, args.order);

  if (orderPredicates) {
    query += ` order by ${orderPredicates}`;
  }

  if (!list) {
    query += ` limit 1`;
  } else if (args.limit != null) {
    query += ` limit ${escape(args.limit)}`;
  }

  if (args.offset) {
    query += ` offset ${escape(args.offset)}`;
  }

  const result = await db(query);
  const rows = result.rows;
  return list ? rows : rows[0];
};
