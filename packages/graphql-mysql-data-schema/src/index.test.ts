import { describe, expect, test } from "@jest/globals";
// import { retry } from "@mo36924/util";
// import { emptyPort, exec } from "@mo36924/util-node";
// import { raw } from "jest-snapshot-serializer-raw";
// import { createConnection } from "mysql2/promise";
// import { buildDataSchema } from "./index";

test("", () => {});

// describe("graphql-mysql-data-schema", () => {
//   const graphql = `
//     type User {
//       name: String!
//       profile: Profile
//       class: Class!
//       clubs: [Club!]!
//     }
//     type Profile {
//       age: Int
//     }
//     type Class {
//       name: String!
//       users: [User!]!
//     }
//     type Club {
//       name: String!
//       users: [User!]!
//     }
//   `;

//   test("buildDataSchema", () => {
//     const sql = buildDataSchema(graphql);

//     expect(raw(sql)).toMatchInlineSnapshot(`
//       create table \`Class\` (
//         \`id\` binary(16) not null primary key,
//         \`version\` integer not null,
//         \`createdAt\` datetime(3) not null,
//         \`updatedAt\` datetime(3) not null,
//         \`isDeleted\` boolean not null,
//         \`name\` longtext not null
//       );
//       create table \`Club\` (
//         \`id\` binary(16) not null primary key,
//         \`version\` integer not null,
//         \`createdAt\` datetime(3) not null,
//         \`updatedAt\` datetime(3) not null,
//         \`isDeleted\` boolean not null,
//         \`name\` longtext not null
//       );
//       create table \`ClubToUser\` (
//         \`id\` binary(16) not null primary key,
//         \`clubId\` binary(16) not null,
//         \`userId\` binary(16) not null
//       );
//       create table \`Profile\` (
//         \`id\` binary(16) not null primary key,
//         \`version\` integer not null,
//         \`createdAt\` datetime(3) not null,
//         \`updatedAt\` datetime(3) not null,
//         \`isDeleted\` boolean not null,
//         \`age\` integer,
//         \`userId\` binary(16)
//       );
//       create table \`User\` (
//         \`id\` binary(16) not null primary key,
//         \`version\` integer not null,
//         \`createdAt\` datetime(3) not null,
//         \`updatedAt\` datetime(3) not null,
//         \`isDeleted\` boolean not null,
//         \`classId\` binary(16),
//         \`name\` longtext not null
//       );
//       alter table \`Profile\` add unique (\`userId\`);
//       alter table \`ClubToUser\` add foreign key (\`clubId\`) references \`Club\` (\`id\`);
//       alter table \`ClubToUser\` add foreign key (\`userId\`) references \`User\` (\`id\`);
//       alter table \`Profile\` add foreign key (\`userId\`) references \`User\` (\`id\`);
//       alter table \`User\` add foreign key (\`classId\`) references \`Class\` (\`id\`);

//     `);
//   });

//   test("create schema", async () => {
//     const sql = buildDataSchema(graphql);
//     const database = "graphql_mysql_data_schema";
//     const port = await emptyPort();
//     await exec(`docker rm -fv ${database}`);

//     await exec(
//       `docker run --name ${database} -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_DATABASE=${database} -p ${port}:3306 -d mysql`,
//     );

//     const connection = await retry(async () => {
//       const connection = await createConnection({ port, database, user: "root", multipleStatements: true });
//       await connection.connect();
//       return connection;
//     });

//     await connection.query(sql);
//     await connection.end();
//   });
// });
