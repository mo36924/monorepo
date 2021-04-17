import { Source, stripIgnoredCharacters } from "graphql";
import { memoize } from "./memoize";
import { source as _source } from "./source";

export const minify = memoize((source: Source) => {
  try {
    return _source(stripIgnoredCharacters(source));
  } catch {
    return source;
  }
}, new WeakMap());
