import { expect, it } from "@jest/globals";
import { buildSchema, Source } from "graphql";
import { customScalars } from "./custom-scalars";
import { modelDirectives } from "./directives";
import { model } from "./model";

it("graphql-model", () => {
  const gql = `
    type User {
      name: String!
      profiles: Profile
      class: Class!
      clubs: [Clubs]
    }
    type Profile {
      age: Int
    }
    type Class {
      name: String!
      user: [User!]
    }
    type Clubs {
      name: String!
      users: [User]!
    }
  `;

  const modelGql = model(gql);
  buildSchema(`${customScalars}${modelDirectives}${modelGql}`);
  const source = new Source(modelGql);

  expect(source).toMatchInlineSnapshot(`
    type Class {
      name: String!
      users: [User!]!
    }

    type Club {
      name: String!
      users: [User!]!
    }

    type Profile {
      age: Int
    }

    type User {
      name: String!
      profile: Profile
      class: Class!
      clubs: [Club!]!
    }

  `);
});
