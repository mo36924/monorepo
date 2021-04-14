import { Source } from "graphql";
import LRU from "lru-cache";

const cache = new LRU<string, Source>(1000);

export const source = (query: string) => {
  let source = cache.get(query);

  if (source) {
    return source;
  }

  source = new Source(query);
  cache.set(query, source);

  return source;
};
