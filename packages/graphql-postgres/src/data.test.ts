import { expect, it } from "@jest/globals";
import { schema } from "@mo36924/graphql-schema";
import { raw } from "jest-snapshot-serializer-raw";
import { data } from "./data";

it("postgres-data", () => {
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

  const sql = data(schema(gql));

  expect(raw(sql)).toMatchInlineSnapshot(`
    alter table "User" disable trigger all;
    alter table "Profile" disable trigger all;
    alter table "Class" disable trigger all;
    alter table "Club" disable trigger all;
    alter table "ClubToUser" disable trigger all;
    insert into "User" ("id","version","createdAt","updatedAt","name","classId") values 
    ('00000000-0000-4000-a000-000000000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-1','00000000-0000-4000-a000-000000000001'),
    ('00000000-0000-4000-a000-000000000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-2','00000000-0000-4000-a000-000000000002'),
    ('00000000-0000-4000-a000-000000000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-3','00000000-0000-4000-a000-000000000003'),
    ('00000000-0000-4000-a000-000000000004',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-4','00000000-0000-4000-a000-000000000001'),
    ('00000000-0000-4000-a000-000000000005',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-5','00000000-0000-4000-a000-000000000002'),
    ('00000000-0000-4000-a000-000000000006',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-6','00000000-0000-4000-a000-000000000003'),
    ('00000000-0000-4000-a000-000000000007',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-7','00000000-0000-4000-a000-000000000001'),
    ('00000000-0000-4000-a000-000000000008',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-8','00000000-0000-4000-a000-000000000002'),
    ('00000000-0000-4000-a000-000000000009',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-9','00000000-0000-4000-a000-000000000003');
    insert into "Profile" ("id","version","createdAt","updatedAt","age","userId") values 
    ('00000000-0000-4000-a000-000001000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000001'),
    ('00000000-0000-4000-a000-000001000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000002'),
    ('00000000-0000-4000-a000-000001000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000003'),
    ('00000000-0000-4000-a000-000001000004',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000004'),
    ('00000000-0000-4000-a000-000001000005',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000005'),
    ('00000000-0000-4000-a000-000001000006',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000006'),
    ('00000000-0000-4000-a000-000001000007',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000007'),
    ('00000000-0000-4000-a000-000001000008',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000008'),
    ('00000000-0000-4000-a000-000001000009',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'00000000-0000-4000-a000-000001000009');
    insert into "Class" ("id","version","createdAt","updatedAt","name") values 
    ('00000000-0000-4000-a000-000002000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-1'),
    ('00000000-0000-4000-a000-000002000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-2'),
    ('00000000-0000-4000-a000-000002000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-3');
    insert into "Club" ("id","version","createdAt","updatedAt","name") values 
    ('00000000-0000-4000-a000-000003000001',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-1'),
    ('00000000-0000-4000-a000-000003000002',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-2'),
    ('00000000-0000-4000-a000-000003000003',1,'1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-3');
    insert into "ClubToUser" ("id","clubId","userId") values 
    ('00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000001'),
    ('00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000002'),
    ('00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000003'),
    ('00000000-0000-4000-a000-000004000004','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000004'),
    ('00000000-0000-4000-a000-000004000005','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000005'),
    ('00000000-0000-4000-a000-000004000006','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000006'),
    ('00000000-0000-4000-a000-000004000007','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000007'),
    ('00000000-0000-4000-a000-000004000008','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000008'),
    ('00000000-0000-4000-a000-000004000009','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000009'),
    ('00000000-0000-4000-a000-000004000010','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000001'),
    ('00000000-0000-4000-a000-000004000011','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000002'),
    ('00000000-0000-4000-a000-000004000012','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000003'),
    ('00000000-0000-4000-a000-000004000013','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000004'),
    ('00000000-0000-4000-a000-000004000014','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000005'),
    ('00000000-0000-4000-a000-000004000015','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000006'),
    ('00000000-0000-4000-a000-000004000016','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000007'),
    ('00000000-0000-4000-a000-000004000017','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000008'),
    ('00000000-0000-4000-a000-000004000018','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000009'),
    ('00000000-0000-4000-a000-000004000019','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000001'),
    ('00000000-0000-4000-a000-000004000020','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000002'),
    ('00000000-0000-4000-a000-000004000021','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000003'),
    ('00000000-0000-4000-a000-000004000022','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000004'),
    ('00000000-0000-4000-a000-000004000023','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000005'),
    ('00000000-0000-4000-a000-000004000024','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000006'),
    ('00000000-0000-4000-a000-000004000025','00000000-0000-4000-a000-000004000001','00000000-0000-4000-a000-000004000007'),
    ('00000000-0000-4000-a000-000004000026','00000000-0000-4000-a000-000004000002','00000000-0000-4000-a000-000004000008'),
    ('00000000-0000-4000-a000-000004000027','00000000-0000-4000-a000-000004000003','00000000-0000-4000-a000-000004000009');
    alter table "User" enable trigger all;
    alter table "Profile" enable trigger all;
    alter table "Class" enable trigger all;
    alter table "Club" enable trigger all;
    alter table "ClubToUser" enable trigger all;

  `);
});
