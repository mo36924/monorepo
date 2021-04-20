import { memoize } from "@mo36924/memoize";
import { Source, stripIgnoredCharacters } from "graphql";
import { source as _source } from "./source";

export const minify = memoize((source: Source) => {
  try {
    return _source(stripIgnoredCharacters(source));
  } catch {
    return source;
  }
}, new WeakMap());
