import type { Fields } from "./types";
import { createObject, primaryKeyTypeName } from "./utils";

export const baseTypeFields: Fields = createObject({
  id: createObject({
    name: "id",
    type: primaryKeyTypeName,
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  version: createObject({
    name: "version",
    type: "Int",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  createdAt: createObject({
    name: "createdAt",
    type: "Date",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  updatedAt: createObject({
    name: "updatedAt",
    type: "Date",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  isDeleted: createObject({
    name: "isDeleted",
    type: "Boolean",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
});

export const baseJoinTypeFields: Fields = createObject({
  id: createObject({
    name: "id",
    type: primaryKeyTypeName,
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  createdAt: createObject({
    name: "createdAt",
    type: "Date",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  updatedAt: createObject({
    name: "updatedAt",
    type: "Date",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
  isDeleted: createObject({
    name: "isDeleted",
    type: "Boolean",
    scalar: true,
    nullable: false,
    list: false,
    directives: Object.create(null),
  }),
});
