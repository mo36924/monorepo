import type { Where } from "@mo36924/graphql-schema";
import type { Context } from "./context";

const wherePredicates = (context: Context, where: Where | null | undefined): string => {
  if (!where) {
    return "";
  }

  const { escapeId, escape } = context;
  const { not, and, or, ...args } = where;
  let predicates: string[] = [];

  for (const [field, ops] of Object.entries(args)) {
    for (const [op, value] of Object.entries(ops)) {
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

  const notPredicates = wherePredicates(context, not);

  if (notPredicates) {
    predicates.push(`not ${notPredicates}`);
  }

  const andPredicates = wherePredicates(context, and);

  if (andPredicates) {
    predicates.push(andPredicates);
  }

  if (predicates.length) {
    predicates = [`${predicates.join(" and ")}`];
  }

  const orPredicates = wherePredicates(context, or);

  if (orPredicates) {
    predicates.push(`${orPredicates}`);
  }

  if (!predicates.length) {
    return "";
  }

  return `(${predicates.join(" or ")})`;
};

export default wherePredicates;
