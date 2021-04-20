import { memoize } from "@mo36924/memoize";
import { GraphQLError, parse as _parse, Source } from "graphql";

export const parse = memoize((source: Source) => {
  try {
    return _parse(source);
  } catch (err) {
    if (err instanceof GraphQLError) {
      return err;
    }

    return new GraphQLError(String(err));
  }
}, new WeakMap());
