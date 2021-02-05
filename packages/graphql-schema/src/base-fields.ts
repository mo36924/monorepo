import type { Fields } from "./types";
import { createObject, primaryKeyTypeName } from "./utils";

export const baseTypeFields: Fields = createObject({
  id: {
    type: primaryKeyTypeName,
    scalar: true,
    null: false,
    list: false,
    directives: {},
  },
  version: {
    type: "Int",
    scalar: true,
    null: false,
    list: false,
    directives: {},
  },
  createdAt: {
    type: "Date",
    scalar: true,
    null: false,
    list: false,
    directives: {},
  },
  updatedAt: {
    type: "Date",
    scalar: true,
    null: false,
    list: false,
    directives: {},
  },
});

export const baseJoinTypeFields: Fields = createObject({
  id: {
    type: primaryKeyTypeName,
    scalar: true,
    null: false,
    list: false,
    directives: {},
  },
});
