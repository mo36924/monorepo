import { GraphQLError, parse as _parse, Source } from "graphql";
import { memoize } from "./memoize";

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
