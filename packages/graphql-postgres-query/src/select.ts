import type { Field, Fields } from "@mo36924/graphql-query";
import type { FieldDirectives } from "@mo36924/graphql-schema";
import { escapeIdentifier, escapeLiteral } from "@mo36924/postgres-escape";
import type { Context } from "./context";
import order from "./order";
import where from "./where";

const select = (context: Context, fields: Fields) => [
  `select ${Object.values(fields)
    .map((field) => `${selectField(context, field, `t${context.id++}`)} ${escapeIdentifier(field.alias)}`)
    .join()}`,
];

const selectFields = (context: Context, fields: Fields, parent: string) =>
  `select json_build_object(${Object.values(fields)
    .map((field) => `${escapeLiteral(field.alias)},${selectField(context, field, parent)}`)
    .join()})`;

const selectField = (context: Context, field: Field, parent: string): string => {
  switch (field.type) {
    case "scalar":
      switch (field.returnType) {
        case "Date":
          return `json_build_array(0,${parent}.${escapeIdentifier(field.name)})`;
        default:
          return `${parent}.${escapeIdentifier(field.name)}`;
      }

    case "object": {
      const tableId = `t${context.id++}`;
      const { parentType, args, list, returnType } = field;
      const clauses: string[] = [`from ${escapeIdentifier(returnType)} ${tableId}`];
      const predicates: string[] = [];
      const directives: FieldDirectives = field.directives;

      if (context.ids) {
        if (context.ids[returnType]) {
          predicates.push(`${tableId}.id in (${context.ids[returnType].map(escapeLiteral).join()})`);
        } else {
          if (list) {
            return `(select '[]'::json)`;
          } else {
            return `(select to_json(null))`;
          }
        }
      }

      if (directives.type) {
        const joinTableId = `t${context.id++}`;

        clauses.push(
          `inner join ${escapeIdentifier(directives.type.name)} ${joinTableId} on ${joinTableId}.${escapeIdentifier(
            directives.type.keys[1],
          )} = ${tableId}}.id`,
        );

        predicates.push(`${joinTableId}.${escapeIdentifier(directives.type.keys[0])} = ${parent}.id`);
      } else if (directives.field) {
        predicates.push(`${tableId}.${escapeIdentifier(directives.field.key)} = ${parent}.id`);
      } else if (directives.key) {
        predicates.push(`${tableId}.id = ${parent}.${escapeIdentifier(directives.key.name)}`);
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

      if (args.orderBy) {
        const orderPredicates = order(args.orderBy, tableId);

        if (orderPredicates) {
          clauses.push(`order by ${orderPredicates}`);
        }
      }

      if (!list) {
        clauses.push(`limit 1`);
      } else if (args.limit != null) {
        clauses.push(`limit ${escapeLiteral(args.limit)}`);
      }

      if (args.offset) {
        clauses.push(`offset ${escapeLiteral(args.offset)}`);
      }

      const selectClause = selectFields(context, field.types[returnType], tableId);

      if (list) {
        return `(select coalesce(json_agg(t.v),'[]'::json) from (${selectClause} v ${clauses.join(" ")}) t)`;
      } else {
        return `(${selectClause} ${clauses.join(" ")})`;
      }
    }

    default:
      return "";
  }
};

export default select;
