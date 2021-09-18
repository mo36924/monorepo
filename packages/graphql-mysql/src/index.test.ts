import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { buildData } from "@mo36924/graphql-mysql-data";
import { buildDataSchema } from "@mo36924/graphql-mysql-data-schema";
import { buildSchema } from "@mo36924/graphql-schema";
import { retry } from "@mo36924/util";
import { exec } from "@mo36924/util-node";
import { createConnection, Connection } from "mysql2/promise";
import { graphql as _graphql } from "./index";

const database = "graphql_mysql";
let connection: Connection;

const model = `
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

const schema = buildSchema(model);
const dataSchema = buildDataSchema(model);
const data = buildData(model);
const graphql = (query: string) => _graphql({ schema, query, source: connection });

beforeAll(async () => {
  try {
    await exec(`docker run --rm --name mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 3306:3306 -d mysql`);
  } catch {}

  await retry(async () => {
    connection = await createConnection({ user: "root", multipleStatements: true });

    await connection.query(`
      drop database if exists ${database};
      create database if not exists ${database};
      use ${database};
      ${dataSchema}
      ${data}
    `);
  });
});

afterAll(async () => {
  try {
    await connection?.end();
  } catch {}
});

test("query", async () => {
  const query = `
    query {
      user(offset: 3) {
        id
        name
        profile {
          age
        }
      }
    }
  `;

  const result = await graphql(query);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "user": Object {
          "id": "00000000-0000-4000-a000-000400000004",
          "name": "name-4",
          "profile": Object {
            "age": 0,
          },
        },
      },
    }
  `);
});

test("create", async () => {
  const query = `
    mutation {
      create(data: { user: { name: "bob" } }) {
        user {
          name
        }
      }
    }
  `;

  const result = await graphql(query);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "create": Object {
          "user": Object {
            "name": "bob",
          },
        },
      },
    }
  `);
});

test("update", async () => {
  const query = `
    mutation {
      update(data: { user: { id: "00000000-0000-4000-a000-000400000001", version: 1, name: "bob1" } }) {
        user {
          id
          version
          name
        }
      }
    }
  `;

  const result = await graphql(query);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "update": Object {
          "user": Object {
            "id": "00000000-0000-4000-a000-000400000001",
            "name": "bob1",
            "version": 2,
          },
        },
      },
    }
  `);
});
