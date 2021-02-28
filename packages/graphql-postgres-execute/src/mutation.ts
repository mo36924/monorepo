import { GraphQLError, GraphQLResolveInfo } from "graphql";
import type { Arguments } from "./arguments";
import type { Context } from "./context";
import create from "./create";
import _delete from "./delete";
import update from "./update";

export default async (source: any, args: Arguments, context: Context, info: GraphQLResolveInfo) => {
  let queries: string[];

  switch (info.fieldName) {
    case "create":
      queries = create(source, args, context, info);
      break;
    case "update":
      queries = update(source, args, context, info);
      break;
    case "delete":
      queries = _delete(source, args, context, info);
      break;
    default:
      return;
  }

  const db = context.db;

  for (const query of queries) {
    const result = await db(query);

    if (result.rowCount !== 1) {
      throw new GraphQLError("Optimistic locking failed.");
    }
  }
};
