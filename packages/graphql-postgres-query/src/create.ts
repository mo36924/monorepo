import { getFieldInfo } from "@mo36924/graphql-utils";
import { escape, escapeId } from "@mo36924/postgres-escape";
import type { GraphQLObjectType } from "graphql";
import { v4 as uuid } from "uuid";
import type { Context } from "./context";
import type { Data } from "./data";

export default (context: Required<Context>, data: Data) => {
  const queries: string[] = [];
  const schema = context.schema;
  const fields = schema.getQueryType()!.getFields();

  for (const [key, value] of Object.entries<any>(data)) {
    if (value == null) {
      continue;
    }

    const { list, type } = getFieldInfo(schema, fields[key]);

    if (list) {
      for (const _value of value) {
        query(context, type, { ..._value, id: uuid() }, queries);
      }
    } else {
      query(context, type, { ...value, id: uuid() }, queries);
    }
  }

  return queries;
};

const query = (context: Required<Context>, type: GraphQLObjectType, data: Data, queries: string[]) => {
  const { schema, ids, date } = context;
  const fields = type.getFields();
  const columns: string[] = ['"id"', '"version"', '"createdAt"', '"updatedAt"', '"isDeleted"'];
  const values: string[] = [escape(data.id), "1", escape(date), escape(date), "FALSE"];
  const _queries: string[] = [];

  if (ids[type.name]) {
    ids[type.name].push(data.id);
  } else {
    ids[type.name] = [data.id];
  }

  for (const [key, value] of Object.entries(data)) {
    switch (key) {
      case "id":
      case "version":
      case "createdAt":
      case "updatedAt":
      case "isDeleted":
        continue;
    }

    const fieldInfo = getFieldInfo(schema, fields[key]);

    if (fieldInfo.scalar) {
      columns.push(escapeId(key));
      values.push(escape(value));
      continue;
    }

    if (value == null) {
      continue;
    }

    const directives = fieldInfo.directives;
    const returnType = fieldInfo.type;

    if (directives.type) {
      for (const _data of value) {
        const id = uuid();

        query(context, returnType, { ..._data, id }, _queries);

        _queries.push(
          `insert into ${escapeId(directives.type.name)} ("id",${escapeId(directives.type.keys[0])},${escapeId(
            directives.type.keys[1],
          )},"createdAt","updatedAt","isDeleted") values (${escape(uuid())},${escape(data.id)},${escape(id)},${escape(
            date,
          )},${escape(date)},FALSE)`,
        );
      }

      continue;
    }

    if (directives.key) {
      const id = uuid();
      columns.push(escapeId(directives.key.name));
      values.push(escape(id));
      query(context, returnType, { ...value, id }, queries);
      continue;
    }

    if (directives.field) {
      if (fieldInfo.list) {
        for (const _value of value) {
          query(context, returnType, { ..._value, id: uuid(), [directives.field.key]: data.id }, _queries);
        }
      } else {
        query(context, returnType, { ...value, id: uuid(), [directives.field.key]: data.id }, _queries);
      }

      continue;
    }
  }

  queries.push(`insert into ${escapeId(type.name)} (${columns.join()}) values (${values.join()})`, ..._queries);
};
