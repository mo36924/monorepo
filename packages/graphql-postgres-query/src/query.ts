import type { Fields } from "@mo36924/graphql-query";
import type { Context } from "./context";
import select from "./select";

export default (context: Context, fields: Fields) => {
  return select(context, fields);
};
