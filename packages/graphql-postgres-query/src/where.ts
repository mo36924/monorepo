import type { Where } from "@mo36924/graphql-schema";
import { escapeIdentifier, escapeLiteral } from "@mo36924/postgres-escape";

const wherePredicates = (where: Where | null | undefined, tableId: string) => {
  if (!where) {
    return "";
  }

  const { not, and, or, ...args } = where;
  let predicates: string[] = [];

  for (const [field, ops] of Object.entries(args)) {
    for (const [op, value] of Object.entries(ops)) {
      if (value === null) {
        switch (op) {
          case "eq":
            predicates.push(`${tableId}.${escapeIdentifier(field)} is null`);
            break;
          case "ne":
            predicates.push(`${tableId}.${escapeIdentifier(field)} is not null`);
            break;
        }

        continue;
      }

      switch (op) {
        case "eq":
          predicates.push(`${tableId}.${escapeIdentifier(field)} = ${escapeLiteral(value)}`);
          break;
        case "ne":
          predicates.push(`${tableId}.${escapeIdentifier(field)} <> ${escapeLiteral(value)}`);
          break;
        case "gt":
          predicates.push(`${tableId}.${escapeIdentifier(field)} > ${escapeLiteral(value)}`);
          break;
        case "lt":
          predicates.push(`${tableId}.${escapeIdentifier(field)} < ${escapeLiteral(value)}`);
          break;
        case "ge":
          predicates.push(`${tableId}.${escapeIdentifier(field)} >= ${escapeLiteral(value)}`);
          break;
        case "le":
          predicates.push(`${tableId}.${escapeIdentifier(field)} <= ${escapeLiteral(value)}`);
          break;
        case "in":
          predicates.push(`${tableId}.${escapeIdentifier(field)} in (${value.map(escapeLiteral).join()})`);
          break;
        case "ni":
          predicates.push(`${tableId}.${escapeIdentifier(field)} not in (${value.map(escapeLiteral).join()})`);
          break;
        case "li":
          predicates.push(`${tableId}.${escapeIdentifier(field)} like ${escapeLiteral(value)}`);
          break;
        case "nl":
          predicates.push(`${tableId}.${escapeIdentifier(field)} not like ${escapeLiteral(value)}`);
          break;
      }

      continue;
    }
  }

  const notPredicates = wherePredicates(not, tableId);

  if (notPredicates) {
    predicates.push(`not ${notPredicates}`);
  }

  const andPredicates = wherePredicates(and, tableId);

  if (andPredicates) {
    predicates.push(andPredicates);
  }

  if (predicates.length) {
    predicates = [`${predicates.join(" and ")}`];
  }

  const orPredicates = wherePredicates(or, tableId);

  if (orPredicates) {
    predicates.push(`${orPredicates}`);
  }

  if (!predicates.length) {
    return "";
  }

  return `(${predicates.join(" or ")})`;
};

export default wherePredicates;
