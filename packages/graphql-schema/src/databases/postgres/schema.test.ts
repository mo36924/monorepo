import { expect, it } from "@jest/globals";
import { raw } from "jest-snapshot-serializer-raw";
import { schema } from "../../schema";
import { schema as postgresSchema } from "./schema";

it("postgres-schema", () => {
  const gql = `
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

  const sql = postgresSchema(schema(gql));

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
    create table "User" (
      "id" uuid not null primary key,
      "version" integer not null,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "isDeleted" boolean not null,
      "name" text not null,
      "classId" uuid
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
    create table "ClubToUser" (
      "id" uuid not null primary key,
      "createdAt" timestamp(3) not null,
      "updatedAt" timestamp(3) not null,
      "isDeleted" boolean not null,
      "clubId" uuid not null,
      "userId" uuid not null
    );
    alter table "Profile" add unique ("userId");
    create index on "User" ("classId");
    create index on "ClubToUser" ("clubId");
    create index on "ClubToUser" ("userId");
    alter table "User" add foreign key ("classId") references "Class" ("id");
    alter table "Profile" add foreign key ("userId") references "User" ("id");
    alter table "ClubToUser" add foreign key ("clubId") references "Club" ("id");
    alter table "ClubToUser" add foreign key ("userId") references "User" ("id");

  `);
});
