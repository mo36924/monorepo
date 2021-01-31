import { describe, expect, it } from "@jest/globals";
import { parse, Source } from "graphql";
import { serialize, test } from "./index";

describe("jest-snapshot-serializer-graphql", () => {
  const gql = "scalar Date type User{id:ID!,name:String createdAt:Date!}";

  it("test", () => {
    expect(test(gql as any)).toBeFalsy();
    expect(test(new Source(gql))).toBeTruthy();
    expect(test(parse(gql))).toBeTruthy();
  });

  it("format", () => {
    expect(serialize(new Source(gql))).toMatchInlineSnapshot(`
      "scalar Date

      type User {
        id: ID!
        name: String
        createdAt: Date!
      }
      "
    `);

    expect(serialize(parse(gql))).toMatchInlineSnapshot(`
      "scalar Date

      type User {
        id: ID!
        name: String
        createdAt: Date!
      }
      "
    `);
  });
});
