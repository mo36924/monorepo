import { afterAll, beforeAll } from "@jest/globals";
import { buildSchemaModel } from "@mo36924/graphql-schema";
import { gql } from "@mo36924/graphql-utilities";
import { retry } from "@mo36924/util";
import { exec } from "@mo36924/util-node";
import { Connection, createConnection } from "mysql2/promise";

export let connection: Connection;

export const model = gql`
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

export const schema = buildSchemaModel(model);

beforeAll(async () => {
  try {
    await exec(`docker run --rm --name mysql -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -p 3306:3306 -d mysql`);
  } catch {}

  connection = await retry(() => createConnection({ user: "root", multipleStatements: true }));
});

afterAll(async () => {
  try {
    await connection?.end();
  } catch {}
});
