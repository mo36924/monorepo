import { Source, stripIgnoredCharacters } from "graphql";
import { source as _source } from "./source";

const cache = new WeakMap<Source, Source>();

export const minify = (source: Source) => {
  let minifySource = cache.get(source);

  if (minifySource) {
    return minifySource;
  }

  minifySource = source;

  try {
    minifySource = _source(stripIgnoredCharacters(source));
  } catch {}

  cache.set(source, minifySource);
  return minifySource;
};
