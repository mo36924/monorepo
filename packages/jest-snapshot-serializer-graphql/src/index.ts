import { DocumentNode, parse, print, Source } from "graphql";

export function test(value: Source | DocumentNode) {
  return value && (value instanceof Source || (value.kind === "Document" && Array.isArray(value.definitions)));
}

export function serialize(value: Source | DocumentNode) {
  if (value instanceof Source) {
    return print(parse(value));
  }

  if (value.kind === "Document" && Array.isArray(value.definitions)) {
    return print(value);
  }
}
