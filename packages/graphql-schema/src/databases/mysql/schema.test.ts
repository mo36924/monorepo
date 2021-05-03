import { expect, it } from "@jest/globals";
import { raw } from "jest-snapshot-serializer-raw";
import { schema } from "../../schema";
import { schema as postgresSchema } from "./schema";

it("mysql-schema", () => {
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
    create table \`Class\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`name\` longtext not null
    );
    create table \`Club\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`name\` longtext not null
    );
    create table \`User\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`name\` longtext not null,
      \`classId\` binary(16)
    );
    create table \`Profile\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`age\` integer,
      \`userId\` binary(16)
    );
    create table \`ClubToUser\` (
      \`id\` binary(16) not null primary key,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`clubId\` binary(16) not null,
      \`userId\` binary(16) not null
    );
    alter table \`Profile\` add unique (\`userId\`);
    create index on \`User\` (\`classId\`);
    create index on \`ClubToUser\` (\`clubId\`);
    create index on \`ClubToUser\` (\`userId\`);
    alter table \`User\` add foreign key (\`classId\`) references \`Class\` (\`id\`);
    alter table \`Profile\` add foreign key (\`userId\`) references \`User\` (\`id\`);
    alter table \`ClubToUser\` add foreign key (\`clubId\`) references \`Club\` (\`id\`);
    alter table \`ClubToUser\` add foreign key (\`userId\`) references \`User\` (\`id\`);

  `);
});
