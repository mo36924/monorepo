import type { WhereArgument } from "@mo36924/graphql-schema";
import { escape, escapeId } from "./util";

export const createWherePredicates = (where: WhereArgument | null | undefined) => {
  if (!where) {
    return "";
  }

  const { not, and, or, ...args } = where;
  let predicates: string[] = [];

  for (const [field, ops] of Object.entries(args)) {
    for (const [op, value] of Object.entries<any>(ops)) {
      if (value === null) {
        switch (op) {
          case "eq":
            predicates.push(`${escapeId(field)} is null`);
            break;
          case "ne":
            predicates.push(`${escapeId(field)} is not null`);
            break;
        }

        continue;
      }

      switch (op) {
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
        case "ni":
          predicates.push(`${escapeId(field)} not in (${value.map(escape).join()})`);
          break;
        case "li":
          predicates.push(`${escapeId(field)} like ${escape(value)}`);
          break;
        case "nl":
          predicates.push(`${escapeId(field)} not like ${escape(value)}`);
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
