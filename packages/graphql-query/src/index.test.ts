import { describe, expect, it } from "@jest/globals";
import { buildSchema, parse } from "graphql";
import { buildQuery as _buildQuery } from "./index";

const buildQuery = (...args: Parameters<typeof _buildQuery>) => {
  const result = _buildQuery(...args);

  if (result.errors) {
    throw result.errors[0];
  }

  return { data: result.data };
};

describe("graphql-query", () => {
  it("object", () => {
    const schema = buildSchema(`
      type Query {
        users(limit: Int!): [User!]!
      }

      type User {
        id: ID!
        name: String!
      }
    `);

    const query = parse(`
      query getUsers($limit: Int!) {
        users(limit: $limit) {
          id
          name
        }
      }
    `);

    const result = buildQuery(schema, query, { limit: 1 });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
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
              "parentType": "Query",
              "returnType": "User",
              "type": "object",
              "types": Object {
                "User": Object {
                  "id": Object {
                    "alias": "id",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "id",
                    "nullable": false,
                    "parentType": "User",
                    "returnType": "ID",
                    "type": "scalar",
                    "types": Object {},
                  },
                  "name": Object {
                    "alias": "name",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "name",
                    "nullable": false,
                    "parentType": "User",
                    "returnType": "String",
                    "type": "scalar",
                    "types": Object {},
                  },
                },
              },
            },
          },
        },
      }
    `);
  });

  it("input", () => {
    const schema = buildSchema(`
      type Query {
        users(data: Data!): [User!]!
      }

      type User {
        id: ID!
        name: String!
      }

      input Data {
        id: ID!
      }
    `);

    const query = parse(`
      query getUsers($data: Data!) {
        users(data: $data) {
          id
          name
        }
      }
    `);

    const result = buildQuery(schema, query, { data: { id: "id" } });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "Query": Object {
            "users": Object {
              "alias": "users",
              "args": Object {
                "data": Object {
                  "id": "id",
                },
              },
              "directives": Object {},
              "list": true,
              "name": "users",
              "nullable": false,
              "parentType": "Query",
              "returnType": "User",
              "type": "object",
              "types": Object {
                "User": Object {
                  "id": Object {
                    "alias": "id",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "id",
                    "nullable": false,
                    "parentType": "User",
                    "returnType": "ID",
                    "type": "scalar",
                    "types": Object {},
                  },
                  "name": Object {
                    "alias": "name",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "name",
                    "nullable": false,
                    "parentType": "User",
                    "returnType": "String",
                    "type": "scalar",
                    "types": Object {},
                  },
                },
              },
            },
          },
        },
      }
    `);
  });

  it("interface", () => {
    const schema = buildSchema(`
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
    `);

    const query = parse(`
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
    `);

    const result = buildQuery(schema, query);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "Query": Object {
            "character": Object {
              "alias": "character",
              "args": Object {},
              "directives": Object {},
              "list": false,
              "name": "character",
              "nullable": true,
              "parentType": "Query",
              "returnType": "Character",
              "type": "interface",
              "types": Object {
                "Character": Object {
                  "id": Object {
                    "alias": "id",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "id",
                    "nullable": false,
                    "parentType": "Character",
                    "returnType": "ID",
                    "type": "scalar",
                    "types": Object {},
                  },
                  "name": Object {
                    "alias": "name",
                    "args": Object {},
                    "directives": Object {},
                    "list": false,
                    "name": "name",
                    "nullable": false,
                    "parentType": "Character",
                    "returnType": "String",
                    "type": "scalar",
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
                    "parentType": "Droid",
                    "returnType": "String",
                    "type": "scalar",
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
                    "parentType": "Human",
                    "returnType": "Int",
                    "type": "scalar",
                    "types": Object {},
                  },
                },
              },
            },
          },
        },
      }
    `);
  });

  it("schema directive", () => {
    const schema = buildSchema(`
      directive @unique on FIELD_DEFINITION
      directive @key(name: String!) on FIELD_DEFINITION

      type Query {
        users: [User!]!
      }

      type User {
        id: ID! @unique
        name: String! @key(name: "id")
      }
    `);

    const query = parse(`
      {
        users {
          id
          name
        }
      }
    `);

    const result = buildQuery(schema, query);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "Query": Object {
            "users": Object {
              "alias": "users",
              "args": Object {},
              "directives": Object {},
              "list": true,
              "name": "users",
              "nullable": false,
              "parentType": "Query",
              "returnType": "User",
              "type": "object",
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
                    "parentType": "User",
                    "returnType": "ID",
                    "type": "scalar",
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
                    "parentType": "User",
                    "returnType": "String",
                    "type": "scalar",
                    "types": Object {},
                  },
                },
              },
            },
          },
        },
      }
    `);
  });
});
