import type { Fields } from "@mo36924/graphql-query";
import type { Context } from "./context";
import create from "./create";
import _delete from "./delete";
import select from "./select";
import update from "./update";

export default (context: Context, fields: Fields) => {
  const queries: string[] = [];

  for (const field of Object.values(fields)) {
    const data = field.args.data;
    context.ids = Object.create(null);

    switch (field.name) {
      case "create":
        queries.push(...create(context as Required<Context>, data));
        break;
      case "update":
        queries.push(...update(context as Required<Context>, data));
        break;
      case "delete":
        queries.push(..._delete(context as Required<Context>, data));
        break;
      default:
        continue;
    }

    queries.push(...select(context, field.types.Query));
  }

  return queries;
};
