import { expect, test } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import { fixModel } from "./model";

test("fixModel", () => {
  const model = fixModel(`
    type User {
      id: ID!
      name: String!
      profiles: Profile
      class: Class!
      clubs: [Clubs]
    }
    type Profile {
      uuid: ID!
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
  `);

  expect(raw(model)).toMatchInlineSnapshot(`
    type Class {
      name: String!
      users: [User!]!
    }

    type Clubs {
      name: String!
      users: [User!]!
    }

    type Profile {
      age: Int
      uuid: UUID!
    }

    type User {
      class: Class!
      clubs: [Club!]!
      name: String!
      profile: Profile
    }

  `);
});
