import { describe, expect, it } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import { Source, parse } from "graphql";
import { serialize, test } from "./index";

describe("jest-snapshot-serializer-graphql", () => {
  const gql = "scalar Date type User{id:ID!,name:String createdAt:Date!}";

  it("test", () => {
    expect(test(gql as any)).toBeFalsy();
    expect(test(new Source(gql))).toBeTruthy();
    expect(test(parse(gql))).toBeTruthy();
  });

  it("format", () => {
    expect(raw(serialize(new Source(gql)))).toMatchInlineSnapshot(`
      scalar Date
      
      type User {
        id: ID!
        name: String
        createdAt: Date!
      }
    `);

    expect(raw(serialize(parse(gql)))).toMatchInlineSnapshot(`
      scalar Date
      
      type User {
        id: ID!
        name: String
        createdAt: Date!
      }
    `);
  });
});
