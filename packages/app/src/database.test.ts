import { describe, test } from "@jest/globals";
import config from "@mo36924/config";
import { schema } from "@mo36924/graphql-schema";
import exec from "@mo36924/promise-exec";
import { createConnection } from "mysql2/promise";
import pg from "pg";
import database from "./database";

describe("database", () => {
  const _schema = schema(`
    type User {
      name: String
    }
    type Profile {
      age: Int
    }
  `);

  test.concurrent("mysql", async () => {
    const main = {
      host: "127.0.0.1",
      port: 13306,
      user: "test",
      password: "test",
      database: "mysql_test",
    };

    const resetDatabase = await database({
      ...config,
      databaseDevelopment: { ...config.databaseDevelopment, name: "mysql", main },
    });

    await resetDatabase(_schema);
    const client = await createConnection(main);
    await client.connect();
    await client.query("select * from `User`");
    await client.query("select * from `Profile`");
    await client.end();
    await exec(`docker rm -vf ${main.database}`);
  });

  test.concurrent("postgres", async () => {
    const main = {
      host: "127.0.0.1",
      port: 15432,
      user: "test",
      password: "test",
      database: "postgres_test",
    };

    const resetDatabase = await database({
      ...config,
      databaseDevelopment: { ...config.databaseDevelopment, name: "postgres", main },
    });

    await resetDatabase(_schema);
    const client = new pg.Client(main);
    await client.connect();
    await client.query(`select * from "User"`);
    await client.query(`select * from "Profile"`);
    await client.end();
    await exec(`docker rm -vf ${main.database}`);
  });
});
