import type { ComparisonOperators, WhereArgument } from "@mo36924/graphql-schema";
import { escape, escapeId } from "./util";

export const createWherePredicates = (where: WhereArgument | null | undefined) => {
  if (!where) {
    return "";
  }

  const { not, and, or, ...args } = where;
  let predicates: string[] = [];

  for (const [field, ops] of Object.entries(args)) {
    if (field === "isDeleted") {
      if (typeof ops === "boolean") {
        predicates.push(`${escapeId(field)} = ${escape(ops)}`);
      }

      continue;
    }

    for (const [op, value] of Object.entries(ops)) {
      if (value === null) {
        switch (op as ComparisonOperators) {
          case "eq":
            predicates.push(`${escapeId(field)} is null`);
            break;
          case "ne":
            predicates.push(`${escapeId(field)} is not null`);
            break;
        }

        continue;
      }

      switch (op as ComparisonOperators) {
        case "eq":
          predicates.push(`${escapeId(field)} = ${escape(value)}`);
          break;
        case "ne":
          predicates.push(`${escapeId(field)} <> ${escape(value)}`);
          break;
        case "gt":
          predicates.push(`${escapeId(field)} > ${escape(value)}`);
          break;
        case "lt":
          predicates.push(`${escapeId(field)} < ${escape(value)}`);
          break;
        case "ge":
          predicates.push(`${escapeId(field)} >= ${escape(value)}`);
          break;
        case "le":
          predicates.push(`${escapeId(field)} <= ${escape(value)}`);
          break;
        case "in":
          predicates.push(`${escapeId(field)} in (${value.map(escape).join()})`);
          break;
        case "like":
          predicates.push(`${escapeId(field)} like ${escape(value)}`);
          break;
      }

      continue;
    }
  }

  const notPredicates = createWherePredicates(not);

  if (notPredicates) {
    predicates.push(`not ${notPredicates}`);
  }

  const andPredicates = createWherePredicates(and);

  if (andPredicates) {
    predicates.push(andPredicates);
  }

  if (predicates.length) {
    predicates = [predicates.join(" and ")];
  }

  const orPredicates = createWherePredicates(or);

  if (orPredicates) {
    predicates.push(orPredicates);
  }

  if (!predicates.length) {
    return "";
  }

  return `(${predicates.join(" or ")})`;
};