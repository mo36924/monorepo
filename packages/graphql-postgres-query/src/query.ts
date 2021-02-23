import type { Fields } from "@mo36924/graphql-query";
import select from "./select";

export default (fields: Fields) => {
  return select({ id: 0 }, fields);
};
