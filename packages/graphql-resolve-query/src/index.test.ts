import { describe, expect, it } from "@jest/globals";
import resolve from "./index";

describe("graphql-resolve-query", () => {
  it("object", () => {
    const schema = `
      type Query {
        users(limit: Int!): [User!]!
      }

      type User {
        id: ID!
        name: String!
      }
    `;

    const query = `
      query getUsers($limit: Int!) {
        users(limit: $limit) {
          id
          name
        }
      }
    `;

    const result = resolve(schema, query, { limit: 1 });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "Query": Object {
          "users": Object {
            "alias": "users",
            "args": Object {
              "limit": 1,
            },
            "directives": Object {},
            "list": true,
            "name": "users",
            "nullable": false,
            "type": "object",
            "typeName": "User",
            "types": Object {
              "User": Object {
                "id": Object {
                  "alias": "id",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "id",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "ID",
                  "types": Object {},
                },
                "name": Object {
                  "alias": "name",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "name",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "String",
                  "types": Object {},
                },
              },
            },
          },
        },
      }
    `);
  });

  it("interface", () => {
    const schema = `
      type Query {
        character: Character
      }

      interface Character {
        id: ID!
        name: String!
      }

      type Human implements Character {
        id: ID!
        name: String!
        friends: [Character]
        totalCredits: Int
      }
       
      type Droid implements Character {
        id: ID!
        name: String!
        primaryFunction: String
      }
    `;

    const query = `
      {
        character {
          id
          name
          ... on Human {
            totalCredits
          }
          ... on Droid {
            primaryFunction
          }
        }
      }
    `;

    const result = resolve(schema, query);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "Query": Object {
          "character": Object {
            "alias": "character",
            "args": Object {},
            "directives": Object {},
            "list": false,
            "name": "character",
            "nullable": true,
            "type": "interface",
            "typeName": "Character",
            "types": Object {
              "Character": Object {
                "id": Object {
                  "alias": "id",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "id",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "ID",
                  "types": Object {},
                },
                "name": Object {
                  "alias": "name",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "name",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "String",
                  "types": Object {},
                },
              },
              "Droid": Object {
                "primaryFunction": Object {
                  "alias": "primaryFunction",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "primaryFunction",
                  "nullable": true,
                  "type": "scalar",
                  "typeName": "String",
                  "types": Object {},
                },
              },
              "Human": Object {
                "totalCredits": Object {
                  "alias": "totalCredits",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "totalCredits",
                  "nullable": true,
                  "type": "scalar",
                  "typeName": "Int",
                  "types": Object {},
                },
              },
            },
          },
        },
      }
    `);
  });

  it("schema directive", () => {
    const schema = `
      directive @unique on FIELD_DEFINITION
      directive @key(name: String!) on FIELD_DEFINITION

      type Query {
        users: [User!]!
      }

      type User {
        id: ID! @unique
        name: String! @key(name: "id")
      }
    `;

    const query = `
      {
        users {
          id
          name
        }
      }
    `;

    const result = resolve(schema, query);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "Query": Object {
          "users": Object {
            "alias": "users",
            "args": Object {},
            "directives": Object {},
            "list": true,
            "name": "users",
            "nullable": false,
            "type": "object",
            "typeName": "User",
            "types": Object {
              "User": Object {
                "id": Object {
                  "alias": "id",
                  "args": Object {},
                  "directives": Object {
                    "unique": Object {},
                  },
                  "list": false,
                  "name": "id",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "ID",
                  "types": Object {},
                },
                "name": Object {
                  "alias": "name",
                  "args": Object {},
                  "directives": Object {
                    "key": Object {
                      "name": "id",
                    },
                  },
                  "list": false,
                  "name": "name",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "String",
                  "types": Object {},
                },
              },
            },
          },
        },
      }
    `);
  });

  it("query directive", () => {
    const schema = `
      directive @default(value: String!) on FIELD

      type Query {
        users: [User!]!
      }

      type User {
        id: ID!
        name: String!
      }
    `;

    const query = `
      {
        users {
          id @default(value: "1")
          name
        }
      }
    `;

    const result = resolve(schema, query);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "Query": Object {
          "users": Object {
            "alias": "users",
            "args": Object {},
            "directives": Object {},
            "list": true,
            "name": "users",
            "nullable": false,
            "type": "object",
            "typeName": "User",
            "types": Object {
              "User": Object {
                "id": Object {
                  "alias": "id",
                  "args": Object {},
                  "directives": Object {
                    "default": Object {
                      "value": "1",
                    },
                  },
                  "list": false,
                  "name": "id",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "ID",
                  "types": Object {},
                },
                "name": Object {
                  "alias": "name",
                  "args": Object {},
                  "directives": Object {},
                  "list": false,
                  "name": "name",
                  "nullable": false,
                  "type": "scalar",
                  "typeName": "String",
                  "types": Object {},
                },
              },
            },
          },
        },
      }
    `);
  });
});
