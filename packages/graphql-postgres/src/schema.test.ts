import { expect, it } from "@jest/globals";
import { schema } from "@mo36924/graphql-schema";
import { raw } from "jest-snapshot-serializer-raw";
import { schema as mysqlSchema } from "./schema";

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

  const sql = mysqlSchema(schema(gql));

  expect(raw(sql)).toMatchInlineSnapshot(`
    create extension if not exists pgcrypto;
    create table "User" (
      "id" uuid not null default gen_random_uuid() primary key,
      "version" integer not null default 1,
      "createdAt" timestamp(3) not null default current_timestamp(3),
      "updatedAt" timestamp(3) not null default current_timestamp(3),
      "name" text not null,
      "classId" uuid
    );
    create table "Profile" (
      "id" uuid not null default gen_random_uuid() primary key,
      "version" integer not null default 1,
      "createdAt" timestamp(3) not null default current_timestamp(3),
      "updatedAt" timestamp(3) not null default current_timestamp(3),
      "age" integer,
      "userId" uuid
    );
    create table "Class" (
      "id" uuid not null default gen_random_uuid() primary key,
      "version" integer not null default 1,
      "createdAt" timestamp(3) not null default current_timestamp(3),
      "updatedAt" timestamp(3) not null default current_timestamp(3),
      "name" text not null
    );
    create table "Club" (
      "id" uuid not null default gen_random_uuid() primary key,
      "version" integer not null default 1,
      "createdAt" timestamp(3) not null default current_timestamp(3),
      "updatedAt" timestamp(3) not null default current_timestamp(3),
      "name" text not null
    );
    create table "ClubToUser" (
      "id" uuid not null default gen_random_uuid() primary key,
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
    create or replace function update_at() returns trigger as $$ begin new."updatedAt" := current_timestamp(3); return new; end; $$ language plpgsql;
    create trigger update_at_user before update on "User" for each row execute procedure update_at();
    create trigger update_at_profile before update on "Profile" for each row execute procedure update_at();
    create trigger update_at_class before update on "Class" for each row execute procedure update_at();
    create trigger update_at_club before update on "Club" for each row execute procedure update_at();

  `);
});
