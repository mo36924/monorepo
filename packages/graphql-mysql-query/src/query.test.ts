import { test, expect } from "@jest/globals";
import { buildSchema } from "@mo36924/graphql-schema";
import { parse } from "graphql";
import { raw } from "jest-snapshot-serializer-raw";
import { query } from "./query";

test("query", () => {
  const schema = buildSchema(`
    type User {
      name: String!
      profile: Profile
      class: Class!
      clubs: [Club!]!
    }
    type Profile {
      age: Int
    }
    type Class {
      name: String!
      users: [User!]!
    }
    type Club {
      name: String!
      users: [User!]!
    }
  `);

  const documentNode = parse(`
    {
      user {
        id
        name
      }
    }
  `);

  const sql = query(schema, documentNode);

  expect(raw(sql)).toMatchInlineSnapshot(
    `select json_object('user',(select json_object('id',\`id\`,'name',\`name\`) from \`User\`)) as data;`,
  );
});
