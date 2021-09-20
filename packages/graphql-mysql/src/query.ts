import { getFieldInfo } from "@mo36924/graphql-schema";
import type { FieldNode, GraphQLObjectType, OperationDefinitionNode } from "graphql";
import type { Context } from "./context";
import { createOrderClause } from "./order";
import { escape, escapedIdColumn, escapedNull, escapeId, escapeUUID } from "./util";
import { createWherePredicates } from "./where";

const query = (context: Context, parentType: GraphQLObjectType, node: OperationDefinitionNode | FieldNode): string =>
  `json_object(${(node.selectionSet!.selections as FieldNode[])
    .map((fieldNode) => `${escape((fieldNode.alias ?? fieldNode.name).value)},${value(context, parentType, fieldNode)}`)
    .join()})`;

const value = (context: Context, parentType: GraphQLObjectType, fieldNode: FieldNode) => {
  const info = getFieldInfo(context.schema, parentType, fieldNode, context.variableValues);
  const typeName = info.type.name;

  if (info.scalar) {
    const value = escapeId(info.name);

    switch (typeName) {
      case "UUID":
        return `bin_to_uuid(${value})`;
      case "Date":
        return `json_array(0,${value})`;
      default:
        return value;
    }
  }

  const { ids } = context;
  const list = info.list;
  const table = escapeId(typeName);
  const predicates: string[] = [];

  if (ids) {
    if (ids[typeName]) {
      predicates.push(`${table}.${escapedIdColumn} in (${ids[typeName].map(escapeUUID).join()})`);
    } else {
      return list ? "json_array()" : escapedNull;
    }
  }

  const {
    type,
    args: { where, order, limit, offset },
    directives,
  } = info;

  const parentTable = escapeId(parentType.name);

  if (directives.type) {
    const joinTable = escapeId(directives.type.name);
    const key0 = escapeId(directives.type.keys[0]);
    const key1 = escapeId(directives.type.keys[1]);

    predicates.push(
      `${escapedIdColumn} in (select ${key1} from ${joinTable} where ${key1} is not null and ${key0} = ${parentTable}.${escapedIdColumn})`,
    );
  } else if (directives.field) {
    predicates.push(`${escapeId(directives.field.key)} = ${parentTable}.${escapedIdColumn}`);
  } else if (directives.key) {
    predicates.push(`${escapedIdColumn} = ${parentTable}.${escapeId(directives.key.name)}`);
  }

  const wherePredicates = createWherePredicates(where);

  if (wherePredicates) {
    predicates.push(wherePredicates);
  }

  const clauses: string[] = [];

  if (predicates.length) {
    clauses.push(`where ${predicates.join(" and ")}`);
  }

  const orderClause = createOrderClause(order);

  if (orderClause) {
    clauses.push(orderClause);
  }

  if (!list) {
    clauses.push("limit 1");
  } else if (limit != null) {
    clauses.push(`limit ${escape(limit)}`);
  }

  if (offset != null) {
    clauses.push(`offset ${escape(offset)}`);
  }

  const jsonObject = query(context, type, fieldNode);
  const tableAndClauses = table + (clauses.length ? ` ${clauses.join(" ")}` : "");

  if (!list) {
    return `(select ${jsonObject} from ${tableAndClauses})`;
  }

  return `coalesce((select json_arrayagg(v) over (order by i rows between unbounded preceding and unbounded following) from (select ${jsonObject} as v,row_number() over() as i from ${tableAndClauses}) as t limit 1),json_array())`;
};

export const createQuery = (context: Context, node: OperationDefinitionNode | FieldNode = context.operation) => {
  const jsonObject = query(context, context.schema.getQueryType()!, node);
  const alias = escapeId(node.kind === "OperationDefinition" ? "data" : (node.alias ?? node.name).value);
  return `select cast(${jsonObject} as char character set utf8mb4) as ${alias};`;
};
