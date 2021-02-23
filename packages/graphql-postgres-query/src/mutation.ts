import type { Fields } from "@mo36924/graphql-query";
import type { GraphQLSchema } from "graphql";
import type { Context } from "./context";
import create from "./create";
import _delete from "./delete";
import select from "./select";
import update from "./update";

export default (schema: GraphQLSchema, fields: Fields) => {
  const queries: string[] = [];

  for (const field of Object.values(fields)) {
    const context: Required<Context> = { id: 0, ids: Object.create(null) };

    switch (field.name) {
      case "create":
        queries.push(...create(context, schema, field));
        break;
      case "update":
        queries.push(...update(context, schema, field));
        break;
      case "delete":
        queries.push(..._delete(context, schema, field));
        break;
      default:
        continue;
    }

    queries.push(...select(context, field.types.Query));
  }

  return queries;
};
