import type { Field, Fields } from "@mo36924/graphql-query";
import type { FieldDirectives } from "@mo36924/graphql-schema";
import { escape, escapeId } from "@mo36924/postgres-escape";
import type { Context } from "./context";
import order from "./order";
import where from "./where";

const select = (context: Context, fields: Fields) => [
  `select ${Object.values(fields)
    .map((field) => `${selectField(context, field, `t${context.id++}`)} ${escapeId(field.alias)}`)
    .join()}`,
];

const selectFields = (context: Context, fields: Fields, parent: string) =>
  `select jsonb_build_object(${Object.values(fields)
    .map((field) => `${escape(field.alias)},${selectField(context, field, parent)}`)
    .join()})`;

const selectField = (context: Context, field: Field, parent: string): string => {
  switch (field.type) {
    case "scalar":
      switch (field.returnType) {
        case "Date":
          return `jsonb_build_array(0,${parent}.${escapeId(field.name)})`;
        default:
          return `${parent}.${escapeId(field.name)}`;
      }

    case "object": {
      const tableId = `t${context.id++}`;
      const { args, list, returnType } = field;
      const clauses: string[] = [`from ${escapeId(returnType)} ${tableId}`];
      const predicates: string[] = [];
      const directives: FieldDirectives = field.directives;

      if (context.ids) {
        if (context.ids[returnType]) {
          predicates.push(`${tableId}.id in (${context.ids[returnType].map(escape).join()})`);
        } else {
          if (list) {
            return `(select '[]'::jsonb)`;
          } else {
            return `(select to_jsonb(null))`;
          }
        }
      }

      if (directives.type) {
        const joinTableId = `t${context.id++}`;

        clauses.push(
          `inner join ${escapeId(directives.type.name)} ${joinTableId} on ${joinTableId}.${escapeId(
            directives.type.keys[1],
          )} = ${tableId}}.id`,
        );

        predicates.push(`${joinTableId}.${escapeId(directives.type.keys[0])} = ${parent}.id`);
      } else if (directives.field) {
        predicates.push(`${tableId}.${escapeId(directives.field.key)} = ${parent}.id`);
      } else if (directives.key) {
        predicates.push(`${tableId}.id = ${parent}.${escapeId(directives.key.name)}`);
      }

      if (args.where) {
        const wherePredicates = where(args.where, tableId);

        if (wherePredicates) {
          predicates.push(`${wherePredicates}`);
        }
      }

      if (predicates.length) {
        clauses.push(`where ${predicates.join(" and ")}`);
      }

      if (args.order) {
        const orderPredicates = order(args.order, tableId);

        if (orderPredicates) {
          clauses.push(`order by ${orderPredicates}`);
        }
      }

      if (!list) {
        clauses.push(`limit 1`);
      } else if (args.limit != null) {
        clauses.push(`limit ${escape(args.limit)}`);
      }

      if (args.offset) {
        clauses.push(`offset ${escape(args.offset)}`);
      }

      const selectClause = selectFields(context, field.types[returnType], tableId);

      if (list) {
        return `(select coalesce(jsonb_agg(t.v),'[]'::jsonb) from (${selectClause} v ${clauses.join(" ")}) t)`;
      } else {
        return `(${selectClause} ${clauses.join(" ")})`;
      }
    }

    default:
      return "";
  }
};

export default select;
