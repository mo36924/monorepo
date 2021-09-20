import { beforeAll, expect, test } from "@jest/globals";
import { connection, schema } from "./setup";
import { escapeId } from "./util";
import { createSchemaQuery, createTestDataQuery, graphql as _graphql } from "./index";

const schemaQuery = createSchemaQuery(schema);
const testDataQuery = createTestDataQuery(schema);
const graphql = (query: string) => _graphql({ schema, query, source: connection });

beforeAll(async () => {
  const database = escapeId("graphql_mysql_index");

  await connection.query(`
    drop database if exists ${database};
    create database if not exists ${database};
    use ${database};
    ${schemaQuery}
    ${testDataQuery}
  `);
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
