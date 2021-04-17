import { Source } from "graphql";
import LRU from "lru-cache";
import { memoize } from "./memoize";

export const source = memoize((query: string) => new Source(query), new LRU(1000));
