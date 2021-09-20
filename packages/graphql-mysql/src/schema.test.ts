import { expect, test } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import { createSchemaQuery } from "./schema";
import { schema } from "./setup";

test("createSchemaQuery", () => {
  expect(raw(createSchemaQuery(schema))).toMatchInlineSnapshot(`
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
    create table \`ClubToUser\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`clubId\` binary(16) not null,
      \`userId\` binary(16) not null
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
    create table \`User\` (
      \`id\` binary(16) not null primary key,
      \`version\` integer not null,
      \`createdAt\` datetime(3) not null,
      \`updatedAt\` datetime(3) not null,
      \`isDeleted\` boolean not null,
      \`classId\` binary(16),
      \`name\` longtext not null
    );
    alter table \`Profile\` add unique (\`userId\`);
    alter table \`ClubToUser\` add foreign key (\`clubId\`) references \`Club\` (\`id\`);
    alter table \`ClubToUser\` add foreign key (\`userId\`) references \`User\` (\`id\`);
    alter table \`Profile\` add foreign key (\`userId\`) references \`User\` (\`id\`);
    alter table \`User\` add foreign key (\`classId\`) references \`Class\` (\`id\`);

  `);
});
