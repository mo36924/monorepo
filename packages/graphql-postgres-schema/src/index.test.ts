import { expect, test } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import pg from "pg";
import buildSchema from "./index";

const model = /* GraphQL */ `
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

test("graphql-postgres-schema", async () => {
  const database = "graphql_postgres_schema";
  const sql = buildSchema(model);
  let client = new pg.Client({ user: "postgres", password: "postgres" });
  await client.connect();
  await client.query(`drop database if exists ${database};`);
  await client.query(`create database ${database};`);
  await client.end();
  client = new pg.Client({ user: "postgres", password: "postgres", database });
  await client.connect();
  await client.query(sql);
  await client.end();

  expect(raw(sql)).toMatchInlineSnapshot(`
    create table "Class" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "name" text not null
    );
    create table "Club" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "name" text not null
    );
    create table "Profile" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "age" integer,
      "userId" uuid
    );
    create table "User" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "classId" uuid,
      "name" text not null
    );
    create table "ClubToUser" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "clubId" uuid not null,
      "userId" uuid not null
    );
    alter table "Profile" add unique ("userId");
    create index on "User" ("classId");
    create index on "ClubToUser" ("clubId");
    create index on "ClubToUser" ("userId");

  `);
});
