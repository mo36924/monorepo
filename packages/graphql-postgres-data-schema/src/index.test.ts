import { describe, expect, test } from "@jest/globals";
import { retry } from "@mo36924/util";
import { emptyPort, exec } from "@mo36924/util-node";
import { raw } from "jest-snapshot-serializer-raw";
import { Client } from "pg";
import { buildDataSchema } from "./index";

describe("graphql-postgres-data-schema", () => {
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

  test("buildDataSchema", () => {
    const sql = buildDataSchema(graphql);

    expect(raw(sql)).toMatchInlineSnapshot(`
      create table "Class" (
        "id" uuid not null primary key,
        "version" integer not null,
        "createdAt" timestamp(3) not null,
        "updatedAt" timestamp(3) not null,
        "isDeleted" boolean not null,
        "name" text not null
      );
      create table "Club" (
        "id" uuid not null primary key,
        "version" integer not null,
        "createdAt" timestamp(3) not null,
        "updatedAt" timestamp(3) not null,
        "isDeleted" boolean not null,
        "name" text not null
      );
      create table "ClubToUser" (
        "id" uuid not null primary key,
        "clubId" uuid not null,
        "userId" uuid not null
      );
      create table "Profile" (
        "id" uuid not null primary key,
        "version" integer not null,
        "createdAt" timestamp(3) not null,
        "updatedAt" timestamp(3) not null,
        "isDeleted" boolean not null,
        "age" integer,
        "userId" uuid
      );
      create table "User" (
        "id" uuid not null primary key,
        "version" integer not null,
        "createdAt" timestamp(3) not null,
        "updatedAt" timestamp(3) not null,
        "isDeleted" boolean not null,
        "classId" uuid,
        "name" text not null
      );
      alter table "Profile" add unique ("userId");
      create index on "ClubToUser" ("clubId");
      create index on "ClubToUser" ("userId");
      create index on "User" ("classId");
      alter table "ClubToUser" add foreign key ("clubId") references "Club" ("id");
      alter table "ClubToUser" add foreign key ("userId") references "User" ("id");
      alter table "Profile" add foreign key ("userId") references "User" ("id");
      alter table "User" add foreign key ("classId") references "Class" ("id");

    `);
  });

  test("create schema", async () => {
    const sql = buildDataSchema(graphql);
    const database = "graphql_postgres_data_schema";
    const port = await emptyPort();
    await exec(`docker rm -fv ${database}`);

    await exec(
      `docker run --name ${database} -e POSTGRES_PASSWORD=${database} -e POSTGRES_USER=${database} -e POSTGRES_DB=${database} -p ${port}:5432 -d postgres`,
    );

    const connection = await retry(async () => {
      const connection = new Client({ port, database, user: database, password: database });
      await connection.connect();
      return connection;
    });

    await connection.query(sql);
    await connection.end();
  });
});
