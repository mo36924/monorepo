import { randomUUID as uuid } from "crypto";
import { isBaseFieldName as _isBaseFieldName, baseFieldNames } from "@mo36924/graphql-base-fields";
import { getDirectives } from "@mo36924/graphql-directives";
import { ComparisonOperator } from "@mo36924/graphql-operators";
import {
  ExecutionArgs,
  FieldNode,
  GraphQLArgs,
  GraphQLError,
  GraphQLObjectType,
  GraphQLSchema,
  OperationDefinitionNode,
  getNamedType,
  getNullableType,
  isListType,
  isNullableType,
  isScalarType,
  parse,
  validate,
  validateSchema,
} from "graphql";
import { ExecutionContext, assertValidExecutionArguments, buildExecutionContext } from "graphql/execution/execute";
import { getArgumentValues } from "graphql/execution/values";

export type Context<T = {}> = ExecutionContext & { contextValue: T };
export type Queries = [sql: string, values: any[]];
export type MutationQueries = Queries[];
type MutationContext = Context<{ date: Date; ids: { [type: string]: string[] | undefined } }>;
type UnorderedMutationQueries = [sortKey: any, sql: string, values: any[]][];

export const graphql = (args: GraphQLArgs) => {
  const { schema, source, rootValue, contextValue, variableValues, operationName, fieldResolver, typeResolver } = args;
  const schemaValidationErrors = validateSchema(schema);

  if (schemaValidationErrors.length > 0) {
    return { errors: schemaValidationErrors };
  }

  let document;

  try {
    document = parse(source);
  } catch (syntaxError) {
    return { errors: [syntaxError as GraphQLError] };
  }

  const validationErrors = validate(schema, document);

  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  return execute({
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  });
};

export const execute = (args: ExecutionArgs) => {
  assertValidExecutionArguments(args.schema, args.document, args.variableValues);
  const context = buildExecutionContext(args);

  if (!("schema" in context)) {
    return { errors: context };
  }

  switch (context.operation.operation) {
    case "query": {
      return { query: query(context as Context) };
    }
    case "mutation": {
      return { mutation: mutation(context as Context) };
    }
    default:
      return { errors: [new GraphQLError(`Unsupported ${context.operation.operation} operation.`, {})] };
  }
};

export const query = (
  context: Context<{ ids?: { [type: string]: string[] | undefined } }>,
  node: OperationDefinitionNode | FieldNode = context.operation,
): Queries => {
  const values: any[] = [];
  const _context = { ...context, contextValue: { ...context.contextValue, values } };

  const sql = `select cast(${fields(_context, "Query", node)} as text) as ${
    node.kind === "OperationDefinition" ? "data" : escapeIdentifier((node.alias ?? node.name).value)
  };`;

  return [sql, values];
};

export const mutation = (context: Context) => {
  const queries: MutationQueries = [];
  const date = new Date();

  for (const node of context.operation.selectionSet.selections as FieldNode[]) {
    const field = node.name.value;
    const method = field === "create" ? create : field === "update" ? update : field === "delete" ? _delete : undefined;

    if (method) {
      const info = getFieldDefInfo(context.schema, "Mutation", field);

      queries.push(
        ...method(
          { ...context, contextValue: { date, ids: Object.create(null) } },
          node,
          getArgumentValues(info.def, node, context.variableValues).data as { [field: string]: any },
        ),
      );
    } else {
      queries.push(query(context, node));
    }
  }

  return queries;
};

const escapeIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;

const escapeLiteral = (value: string) => {
  value = `'${value.replaceAll("'", "''")}'`;

  if (value.includes("\\")) {
    value = `E${value.replaceAll("\\", "\\\\")}`;
  }

  return value;
};

const memoize = <T extends (a1: any, a2: any, a3: any) => any>(fn: T): T => {
  const cache0 = new Map();
  return ((a1: any, a2: any, a3: any): any => {
    let cache1 = cache0.get(a1);

    if (cache1 === undefined) {
      cache1 = new Map();
      cache0.set(a1, cache1);
    }

    let cache2 = cache1.get(a2);

    if (cache2 === undefined) {
      cache2 = new Map();
      cache1.set(a2, cache2);
    }

    let fnResult = cache2.get(a3);

    if (fnResult === undefined) {
      fnResult = fn(a1, a2, a3);
      cache2.set(a3, fnResult);
    }

    return fnResult;
  }) as any;
};

const getFieldDefInfo = memoize((schema: GraphQLSchema, parent: string, field: string) => {
  const def = (schema.getType(parent) as GraphQLObjectType).getFields()[field];
  const name = field;
  const fieldType = def.type;
  const nullable = isNullableType(fieldType);
  const nullableType = getNullableType(fieldType);
  const list = isListType(nullableType);
  const namedType = getNamedType(nullableType);
  const scalar = isScalarType(namedType);
  const type = namedType.name;
  const directives = getDirectives(schema, def.astNode!);
  const isBaseFieldName = _isBaseFieldName(name);
  return { schema, parent, def, name, type, scalar, list, nullable, directives, isBaseFieldName };
});

const fields = (
  context: Context<{ ids?: { [type: string]: string[] | undefined }; values: any[] }>,
  parent: string,
  node: OperationDefinitionNode | FieldNode,
) =>
  `jsonb_build_object(${(node.selectionSet!.selections as FieldNode[])
    .map((node) => `${escapeLiteral((node.alias ?? node.name).value)},${field(context, parent, node)}`)
    .join()})`;

const field = (
  context: Context<{ ids?: { [type: string]: string[] | undefined }; values: any[] }>,
  parent: string,
  node: FieldNode,
) => {
  const {
    schema,
    variableValues,
    contextValue: { ids, values },
  } = context;

  const name = node.name.value;
  const { scalar, type, list, directives, def } = getFieldDefInfo(schema, parent, name);

  if (scalar) {
    switch (type) {
      case "Date":
        return `jsonb_build_array(0,${escapeIdentifier(name)})`;
      default:
        return escapeIdentifier(name);
    }
  }

  let _ids: string[] | undefined;

  if (ids) {
    _ids = ids[type];

    if (!_ids) {
      return list ? `jsonb_build_array()` : "null";
    }
  }

  let query: string = `select ${fields(context, type, node)} as "data" from ${escapeIdentifier(type)}`;
  const args: { [argument: string]: any } = getArgumentValues(def, node, variableValues);
  const predicates: string[] = [];

  if (_ids) {
    predicates.push(`"id" in (${_ids.map((id) => `$${values.push(id)}`).join()})`);
  }

  if (directives.type) {
    predicates.push(
      `"id" in (select ${escapeIdentifier(directives.type.keys[1])} from ${escapeIdentifier(
        directives.type.name,
      )} where ${escapeIdentifier(directives.type.keys[1])} is not null and ${escapeIdentifier(
        directives.type.keys[0],
      )} = ${escapeIdentifier(parent)}."id")`,
    );
  } else if (directives.field) {
    predicates.push(`${escapeIdentifier(directives.field.key)} = ${escapeIdentifier(parent)}."id"}`);
  } else if (directives.key) {
    predicates.push(`"id" = ${escapeIdentifier(parent)}.${escapeIdentifier(directives.key.name)}`);
  }

  const _where = where(context, args.where);
  const _order = order(args.order);

  if (_where) {
    predicates.push(_where);
  }

  if (predicates.length) {
    query += ` where ${predicates.join(" and ")}`;
  }

  if (_order) {
    query += ` order by ${_order}`;
  }

  if (!list) {
    query += ` limit 1`;
  } else if (args.limit != null) {
    query += ` limit $${values.push(args.limit)}`;
  }

  if (args.offset != null) {
    query += ` offset $${values.push(args.offset)}`;
  }

  if (list) {
    query = `coalesce(select jsonb_agg("data") from (${query}),jsonb_build_array())`;
  }

  return query;
};

const where = (context: Context<{ values: any[] }>, args: { [key: string]: any } | null | undefined) => {
  if (!args) {
    return "";
  }

  const { not, and, or, ...fields } = args;
  const _not = where(context, not);
  const _and = where(context, and);
  const _or = where(context, or);
  const values = context.contextValue.values;
  let predicates: string[] = [];

  for (const [field, operators] of Object.entries(fields)) {
    if (operators == null) {
      continue;
    }

    for (const [operator, value] of Object.entries(operators) as [ComparisonOperator, any][]) {
      if (value === null) {
        if (operator === "eq") {
          predicates.push(`${escapeIdentifier(field)} is null`);
        } else if (operator === "ne") {
          predicates.push(`${escapeIdentifier(field)} is not null`);
        }

        continue;
      }

      switch (operator) {
        case "eq":
          predicates.push(`${escapeIdentifier(field)} = $${values.push(value)}`);
          break;
        case "ne":
          predicates.push(`${escapeIdentifier(field)} <> $${values.push(value)}`);
          break;
        case "gt":
          predicates.push(`${escapeIdentifier(field)} > $${values.push(value)}`);
          break;
        case "lt":
          predicates.push(`${escapeIdentifier(field)} < $${values.push(value)}`);
          break;
        case "ge":
          predicates.push(`${escapeIdentifier(field)} >= $${values.push(value)}`);
          break;
        case "le":
          predicates.push(`${escapeIdentifier(field)} <= $${values.push(value)}`);
          break;
        case "in":
          predicates.push(
            `${escapeIdentifier(field)} in (${value.map((value: any) => `$${values.push(value)}`).join()})`,
          );

          break;
        case "like":
          predicates.push(`${escapeIdentifier(field)} like $${values.push(value)}`);
          break;
      }
    }
  }

  if (_not) {
    predicates.push(`not ${_not}`);
  }

  if (_and) {
    predicates.push(_and);
  }

  if (predicates.length) {
    predicates = [predicates.join(" and ")];
  }

  if (_or) {
    predicates.push(_or);
  }

  if (!predicates.length) {
    return "";
  }

  return `(${predicates.join(" or ")})`;
};

const order = (args: { [key: string]: string } | null | undefined) =>
  args
    ? Object.entries(args)
        .map(([field, order]) => `${escapeIdentifier(field)} ${order.replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`)}`)
        .join()
    : "";

const create = (context: MutationContext, node: FieldNode, data: { [field: string]: any }) => {
  const queries: MutationQueries = [];
  const { schema, contextValue } = context;

  for (const [field, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldDefInfo(schema, "Query", field);

    if (list) {
      for (const _value of value) {
        queries.push(...createQueries(context, type, { ..._value, id: uuid() }));
      }
    } else {
      queries.push(...createQueries(context, type, { ...value, id: uuid() }));
    }
  }

  queries.push(query(context, node));
  return queries;
};

const createQueries = (
  context: MutationContext,
  parent: string,
  data: { id: string; [field: string]: any },
): MutationQueries => {
  const {
    schema,
    contextValue: { date, ids },
  } = context;

  const id = data.id;
  const columns: string[] = [...baseFieldNames];
  const values: any[] = [id, 1, date, date];
  const pre: MutationQueries = [];
  const post: MutationQueries = [];
  (ids[parent] ??= []).push(id);

  for (const [field, value] of Object.entries(data)) {
    const { type, scalar, list, directives, isBaseFieldName } = getFieldDefInfo(schema, parent, field);

    if (isBaseFieldName) {
      continue;
    }

    if (scalar) {
      columns.push(field);
      values.push(value);
      continue;
    }

    if (value == null) {
      continue;
    }

    if (directives.type) {
      const insert = `insert into ${escapeIdentifier(directives.type.name)} (${[
        ...baseFieldNames,
        directives.type.keys[0],
        directives.type.keys[1],
      ]
        .map(escapeIdentifier)
        .join()}) values `;

      for (const data of value) {
        const _id = uuid();

        post.push(...createQueries(context, type, { ...data, id: _id }), [
          `${insert}($1,$2,$3,$4,$5,$6);`,
          [uuid(), 1, date, date, id, _id],
        ]);
      }
    } else if (directives.key) {
      const id = uuid();
      columns.push(directives.key.name);
      values.push(id);
      pre.push(...createQueries(context, type, { ...value, id }));
    } else if (directives.field) {
      if (list) {
        for (const data of value) {
          post.push(...createQueries(context, type, { ...data, id: uuid(), [directives.field.key]: id }));
        }
      } else {
        post.push(...createQueries(context, type, { ...value, id: uuid(), [directives.field.key]: id }));
      }
    }
  }

  return [
    ...pre,
    [
      `insert into ${escapeIdentifier(parent)} (${columns.map(escapeIdentifier).join()}) values (${values
        .map((_, i) => `$${++i}`)
        .join()});`,
      values,
    ],
    ...post,
  ];
};

const toQueries = (queries: UnorderedMutationQueries): MutationQueries =>
  queries
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([_, sql, values]): [sql: string, values: any[]] => [sql, values]);

const update = (context: MutationContext, node: FieldNode, data: { [field: string]: any }): MutationQueries => {
  const mutationQueries: UnorderedMutationQueries = [];

  for (const [field, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldDefInfo(context.schema, "Query", field);

    if (list) {
      for (const _value of value) {
        mutationQueries.push(...updateQueries(context, type, _value));
      }
    } else {
      mutationQueries.push(...updateQueries(context, type, value));
    }
  }

  const queries = toQueries(mutationQueries);
  queries.push(query(context, node));
  return queries;
};

const updateQueries = (
  context: MutationContext,
  parent: string,
  data: { id: string; version: number; [field: string]: any },
): UnorderedMutationQueries => {
  const mutationQueries: UnorderedMutationQueries = [];

  const {
    schema,
    contextValue: { date, ids },
  } = context;

  const { id, version } = data;
  const values: any[] = [];
  let set = `set "version"=${values.push(version + 1)},"updatedAt"=${values.push(date)}`;
  let where = `where "id"=$${values.push(id)} and "version"=$${values.push(version)}`;
  (ids[parent] ??= []).push(id);

  for (const [field, value] of Object.entries(data)) {
    const { type, scalar, list, directives, isBaseFieldName } = getFieldDefInfo(schema, parent, field);

    if (isBaseFieldName) {
      continue;
    }

    if (directives.ref) {
      if (value != null) {
        where += ` and ${escapeIdentifier(field)}=$${values.push(value)}`;
      }

      continue;
    }

    if (scalar) {
      set += `,${escapeIdentifier(field)}=$${values.push(value)}`;
      continue;
    }

    if (value == null) {
      continue;
    }

    if (directives.type) {
      const update = `update ${escapeIdentifier(
        directives.type.name,
      )} set "version"="version"+1,"updatedAt"=$1 where ${escapeIdentifier(
        directives.type.keys[0],
      )}=$2 and ${escapeIdentifier(directives.type.keys[1])}=$3;`;

      for (const data of value) {
        const _id = data.id;
        mutationQueries.push(...updateQueries(context, type, data), [id < _id ? id : _id, update, [date, id, _id]]);
      }
    } else if (directives.key) {
      where += ` and ${escapeIdentifier(directives.key.name)}=$${values.push(value.id)}`;
      mutationQueries.push(...updateQueries(context, type, value));
    } else if (directives.field) {
      if (list) {
        for (const data of value) {
          mutationQueries.push(...updateQueries(context, type, { ...data, [directives.field.key]: id }));
        }
      } else {
        mutationQueries.push(...updateQueries(context, type, { ...value, [directives.field.key]: id }));
      }
    }
  }

  mutationQueries.push([id, `update ${escapeIdentifier(parent)} ${set} ${where};`, values]);
  return mutationQueries;
};

const _delete = (context: MutationContext, node: FieldNode, data: { [field: string]: any }) => {
  const mutationQueries: UnorderedMutationQueries = [];

  for (const [field, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldDefInfo(context.schema, "Query", field);

    if (list) {
      for (const _value of value) {
        mutationQueries.push(...deleteQueries(context, type, _value));
      }
    } else {
      mutationQueries.push(...deleteQueries(context, type, value));
    }
  }

  const queries = toQueries(mutationQueries);
  queries.unshift(query(context, node));
  return queries;
};

const deleteQueries = (
  context: MutationContext,
  parent: string,
  data: { id: string; version: number; [field: string]: any },
): UnorderedMutationQueries => {
  const mutationQueries: UnorderedMutationQueries = [];

  const {
    schema,
    contextValue: { ids },
  } = context;

  const { id, version } = data;
  const values: any[] = [];
  let where = `where "id"=$${values.push(id)} and "version"=$${values.push(version)}`;
  (ids[parent] ??= []).push(id);

  for (const [field, value] of Object.entries(data)) {
    if (value == null) {
      continue;
    }

    const { type, scalar, list, directives } = getFieldDefInfo(schema, parent, field);

    if (directives.ref) {
      if (value) {
        where += ` and ${escapeIdentifier(field)}=$${values.push(value)}`;
      }

      continue;
    }

    if (scalar) {
      continue;
    }

    if (directives.type) {
      const _delete = `delete from ${escapeIdentifier(directives.type.name)} where ${escapeIdentifier(
        directives.type.keys[0],
      )}=$1 and ${escapeIdentifier(directives.type.keys[1])}=$2;`;

      for (const data of value) {
        const _id = data.id;
        mutationQueries.push(...deleteQueries(context, type, data), [id < _id ? id : _id, _delete, [id, _id]]);
      }
    } else if (directives.key) {
      where += ` and ${escapeIdentifier(directives.key.name)}=$${values.push(value.id)}`;
      mutationQueries.push(...deleteQueries(context, type, value));
    } else if (directives.field) {
      if (list) {
        for (const data of value) {
          mutationQueries.push(...deleteQueries(context, type, { ...data, [directives.field.key]: id }));
        }
      } else {
        mutationQueries.push(...deleteQueries(context, type, { ...value, [directives.field.key]: id }));
      }
    }
  }

  mutationQueries.push([id, `delete from ${escapeIdentifier(parent)} ${where};`, values]);
  return mutationQueries;
};
