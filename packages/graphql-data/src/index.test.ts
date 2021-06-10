import { expect, test } from "@jest/globals";
import { buildData } from "./index";

test("buildSchemaDataTypes", () => {
  const graphql = `
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
  `;

  const data = buildData(graphql);

  expect(data).toBeTruthy();
});
