import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { model, schema as graphqlSchema } from "@mo36924/graphql-schema";
import { buildSchema as graphqlBuildSchema, DocumentNode, GraphQLSchema, parse } from "graphql";
import { raw } from "jest-snapshot-serializer-raw";
import postgresQuery from "./index";

const buildSchema = (gql: string) => graphqlBuildSchema(graphqlSchema(model(gql)));

const rawQuery = (
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [key: string]: any },
  operationName?: string,
) => {
  const result = postgresQuery(schema, document, variables, operationName);
  return raw(result.data!.map((query) => query + ";").join("\n"));
};

let i = 0;

jest.mock("uuid", () => {
  return {
    v4: () => `00000000-0000-4000-a000-${(i++).toString().padStart(12, "0")}`,
  };
});

jest.useFakeTimers("modern").setSystemTime(new Date("2020-01-01").getTime());

describe("graphql-postgres-query", () => {
  beforeEach(() => {
    i = 0;
  });

  const schema = buildSchema(`
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
  `);

  it("query 1", () => {
    const document = parse(`
      query getUser {
        user {
          id
          name
        }
      }
    `);

    const query = rawQuery(schema, document);

    expect(query).toMatchInlineSnapshot(
      `select (select jsonb_build_object('id',t1."id",'name',t1."name") from "User" t1 limit 1) "user";`,
    );
  });

  it("query *", () => {
    const document = parse(`
      query getUsers($limit: Int!) {
        users(limit: $limit) {
          id
          name
        }
      }
    `);

    const query = rawQuery(schema, document, { limit: 3 });

    expect(query).toMatchInlineSnapshot(
      `select (select coalesce(jsonb_agg(t.v),'[]'::jsonb) from (select jsonb_build_object('id',t1."id",'name',t1."name") v from "User" t1 limit 3) t) "users";`,
    );
  });

  it("query 1:*", () => {
    const document = parse(`
      query getClass($name: String!) {
        class(where: { name: { eq: $name }}) {
          name
          users {
            id
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, { name: "name-1" });

    expect(query).toMatchInlineSnapshot(
      `select (select jsonb_build_object('name',t1."name",'users',(select coalesce(jsonb_agg(t.v),'[]'::jsonb) from (select jsonb_build_object('id',t2."id",'name',t2."name") v from "User" t2 where t2."classId" = t1.id) t)) from "Class" t1 where (t1."name" = 'name-1') limit 1) "class";`,
    );
  });

  it("create 1", () => {
    const document = parse(`
      mutation createUser($data: CreateData!) {
        create(data: $data) {
          user {
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, { data: { user: { name: "bob" } } });

    expect(query).toMatchInlineSnapshot(`
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000000',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'bob');
      select (select jsonb_build_object('name',t1."name") from "User" t1 where t1.id in ('00000000-0000-4000-a000-000000000000') limit 1) "user";
    `);
  });

  it("create *", () => {
    const document = parse(`
      mutation createUsers($data: CreateData!) {
        create(data: $data) {
          user {
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, { data: { users: [{ name: "john" }, { name: "jane" }] } });

    expect(query).toMatchInlineSnapshot(`
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000000',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'john');
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000001',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'jane');
      select (select jsonb_build_object('name',t1."name") from "User" t1 where t1.id in ('00000000-0000-4000-a000-000000000000','00000000-0000-4000-a000-000000000001') limit 1) "user";
    `);
  });

  it("create 1:1", () => {
    const document = parse(`
      mutation createUser($data: CreateData!) {
        create(data: $data) {
          user {
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, { data: { user: { name: "bob", profile: { age: 20 } } } });

    expect(query).toMatchInlineSnapshot(`
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000000',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'bob');
      insert into "Profile" ("id","version","createdAt","updatedAt","isDeleted","age","userId") values ('00000000-0000-4000-a000-000000000001',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,20,'00000000-0000-4000-a000-000000000000');
      select (select jsonb_build_object('name',t1."name") from "User" t1 where t1.id in ('00000000-0000-4000-a000-000000000000') limit 1) "user";
    `);
  });

  it("create 1:*", () => {
    const document = parse(`
      mutation createClass($data: CreateData!) {
        create(data: $data) {
          user {
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, {
      data: { class: { name: "class-1", users: [{ name: "john" }, { name: "jane" }] } },
    });

    expect(query).toMatchInlineSnapshot(`
      insert into "Class" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000000',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'class-1');
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name","classId") values ('00000000-0000-4000-a000-000000000001',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'john','00000000-0000-4000-a000-000000000000');
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name","classId") values ('00000000-0000-4000-a000-000000000002',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'jane','00000000-0000-4000-a000-000000000000');
      select (select jsonb_build_object('name',t1."name") from "User" t1 where t1.id in ('00000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000002') limit 1) "user";
    `);
  });

  it("create *:*", () => {
    const document = parse(`
      mutation createClubs($data: CreateData!) {
        create(data: $data) {
          user {
            name
          }
        }
      }
    `);

    const query = rawQuery(schema, document, {
      data: {
        clubs: [
          {
            name: "club-1",
            users: [{ name: "john" }, { name: "jane", clubs: [{ name: "club-2" }, { name: "club-3" }] }],
          },
        ],
      },
    });

    expect(query).toMatchInlineSnapshot(`
      insert into "Club" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000000',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'club-1');
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000001',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'john');
      insert into "ClubToUser" ("id","clubId","userId","createdAt","updatedAt","isDeleted") values ('00000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000000','00000000-0000-4000-a000-000000000001','2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE);
      insert into "User" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000003',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'jane');
      insert into "Club" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000004',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'club-2');
      insert into "ClubToUser" ("id","userId","clubId","createdAt","updatedAt","isDeleted") values ('00000000-0000-4000-a000-000000000005','00000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000004','2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE);
      insert into "Club" ("id","version","createdAt","updatedAt","isDeleted","name") values ('00000000-0000-4000-a000-000000000006',1,'2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE,'club-3');
      insert into "ClubToUser" ("id","userId","clubId","createdAt","updatedAt","isDeleted") values ('00000000-0000-4000-a000-000000000007','00000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000006','2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE);
      insert into "ClubToUser" ("id","clubId","userId","createdAt","updatedAt","isDeleted") values ('00000000-0000-4000-a000-000000000008','00000000-0000-4000-a000-000000000000','00000000-0000-4000-a000-000000000003','2020-01-01 00:00:00.000','2020-01-01 00:00:00.000',FALSE);
      select (select jsonb_build_object('name',t1."name") from "User" t1 where t1.id in ('00000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000003') limit 1) "user";
    `);
  });
});
