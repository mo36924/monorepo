import { expect, test } from "@jest/globals";
import { buildModel } from "./index";

test("buildModel", () => {
  const { graphql, types } = buildModel(/* GraphQL */ `
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

  expect(graphql).toMatchInlineSnapshot(`
    "scalar Date

    scalar UUID

    scalar JSON

    directive @join on OBJECT

    directive @unique on FIELD_DEFINITION

    directive @key(name: String!) on FIELD_DEFINITION

    directive @ref(name: String!) on FIELD_DEFINITION

    directive @field(name: String!, key: String!) on FIELD_DEFINITION

    directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION

    type Query {
      class(where: WhereClass, order: OrderClass, offset: Int): Class
      classes(where: WhereClass, order: OrderClass, limit: Int, offset: Int): [Class!]!
      club(where: WhereClub, order: OrderClub, offset: Int): Club
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
      profile(where: WhereProfile, order: OrderProfile, offset: Int): Profile
      profiles(where: WhereProfile, order: OrderProfile, limit: Int, offset: Int): [Profile!]!
      user(where: WhereUser, order: OrderUser, offset: Int): User
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
    }

    type Mutation {
      create(data: CreateData!): Query!
      update(data: UpdateData!): Query!
      delete(data: DeleteData!): Query!
      read: Query!
    }

    type Class {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]! @field(name: \\"class\\", key: \\"classId\\")
    }

    type Club {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
        @type(name: \\"ClubToUser\\", keys: [\\"clubId\\", \\"userId\\"])
    }

    type Profile {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      age: Int
      user(where: WhereUser): User @key(name: \\"userId\\")
      userId: UUID @ref(name: \\"User\\") @unique
    }

    type User {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      class(where: WhereClass): Class @key(name: \\"classId\\")
      classId: UUID @ref(name: \\"Class\\")
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
        @type(name: \\"ClubToUser\\", keys: [\\"userId\\", \\"clubId\\"])
      name: String!
      profile(where: WhereProfile): Profile @field(name: \\"user\\", key: \\"userId\\")
    }

    type ClubToUser @join {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      clubId: UUID! @ref(name: \\"Club\\")
      userId: UUID! @ref(name: \\"User\\")
    }

    input CreateData {
      class: CreateDataClass
      classes: [CreateDataClass!]
      club: CreateDataClub
      clubs: [CreateDataClub!]
      profile: CreateDataProfile
      profiles: [CreateDataProfile!]
      user: CreateDataUser
      users: [CreateDataUser!]
    }

    input UpdateData {
      class: UpdateDataClass
      classes: [UpdateDataClass!]
      club: UpdateDataClub
      clubs: [UpdateDataClub!]
      profile: UpdateDataProfile
      profiles: [UpdateDataProfile!]
      user: UpdateDataUser
      users: [UpdateDataUser!]
    }

    input DeleteData {
      class: DeleteDataClass
      classes: [DeleteDataClass!]
      club: DeleteDataClub
      clubs: [DeleteDataClub!]
      profile: DeleteDataProfile
      profiles: [DeleteDataProfile!]
      user: DeleteDataUser
      users: [DeleteDataUser!]
    }

    input CreateDataClass {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataClub {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataProfile {
      age: Int
      user: CreateDataUser
    }

    input CreateDataUser {
      class: CreateDataClass
      clubs: [CreateDataClub!]
      name: String!
      profile: CreateDataProfile
    }

    input UpdateDataClass {
      id: UUID!
      version: Int!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataClub {
      id: UUID!
      version: Int!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataProfile {
      id: UUID!
      version: Int!
      age: Int
      user: UpdateDataUser
    }

    input UpdateDataUser {
      id: UUID!
      version: Int!
      class: UpdateDataClass
      clubs: [UpdateDataClub!]
      name: String
      profile: UpdateDataProfile
    }

    input DeleteDataClass {
      id: UUID!
      version: Int!
      users: [DeleteDataUser!]
    }

    input DeleteDataClub {
      id: UUID!
      version: Int!
      users: [DeleteDataUser!]
    }

    input DeleteDataProfile {
      id: UUID!
      version: Int!
      user: DeleteDataUser
    }

    input DeleteDataUser {
      id: UUID!
      version: Int!
      class: DeleteDataClass
      clubs: [DeleteDataClub!]
      profile: DeleteDataProfile
    }

    input WhereClass {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClass
      or: WhereClass
      not: WhereClass
    }

    input WhereClub {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClub
      or: WhereClub
      not: WhereClub
    }

    input WhereProfile {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      age: WhereInt
      userId: WhereUUID
      and: WhereProfile
      or: WhereProfile
      not: WhereProfile
    }

    input WhereUser {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      classId: WhereUUID
      name: WhereString
      and: WhereUser
      or: WhereUser
      not: WhereUser
    }

    input WhereID {
      eq: ID
      ne: ID
      gt: ID
      lt: ID
      ge: ID
      le: ID
      in: [ID]
      like: String
    }

    input WhereInt {
      eq: Int
      ne: Int
      gt: Int
      lt: Int
      ge: Int
      le: Int
      in: [Int]
      like: String
    }

    input WhereFloat {
      eq: Float
      ne: Float
      gt: Float
      lt: Float
      ge: Float
      le: Float
      in: [Float]
      like: String
    }

    input WhereString {
      eq: String
      ne: String
      gt: String
      lt: String
      ge: String
      le: String
      in: [String]
      like: String
    }

    input WhereBoolean {
      eq: Boolean
      ne: Boolean
    }

    input WhereDate {
      eq: Date
      ne: Date
      gt: Date
      lt: Date
      ge: Date
      le: Date
      in: [Date]
      like: String
    }

    input WhereUUID {
      eq: UUID
      ne: UUID
      gt: UUID
      lt: UUID
      ge: UUID
      le: UUID
      in: [UUID]
      like: String
    }

    input WhereJSON {
      eq: JSON
      ne: JSON
      gt: JSON
      lt: JSON
      ge: JSON
      le: JSON
      in: [JSON]
      like: String
    }

    input OrderClass {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    input OrderClub {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    input OrderProfile {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      age: Order
      userId: Order
    }

    input OrderUser {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      classId: Order
      name: Order
    }

    enum Order {
      asc
      desc
    }
    "
  `);

  expect(types).toMatchInlineSnapshot(`
    Object {
      "Class": Object {
        "directives": Object {},
        "fields": Object {
          "createdAt": Object {
            "directives": Object {},
            "list": false,
            "name": "createdAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "id": Object {
            "directives": Object {},
            "list": false,
            "name": "id",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "name": Object {
            "directives": Object {},
            "list": false,
            "name": "name",
            "nullable": false,
            "scalar": true,
            "type": "String",
          },
          "updatedAt": Object {
            "directives": Object {},
            "list": false,
            "name": "updatedAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "users": Object {
            "directives": Object {
              "field": Object {
                "key": "classId",
                "name": "class",
              },
            },
            "list": true,
            "name": "users",
            "nullable": false,
            "scalar": false,
            "type": "User",
          },
          "version": Object {
            "directives": Object {},
            "list": false,
            "name": "version",
            "nullable": false,
            "scalar": true,
            "type": "Int",
          },
        },
        "name": "Class",
      },
      "Club": Object {
        "directives": Object {},
        "fields": Object {
          "createdAt": Object {
            "directives": Object {},
            "list": false,
            "name": "createdAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "id": Object {
            "directives": Object {},
            "list": false,
            "name": "id",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "name": Object {
            "directives": Object {},
            "list": false,
            "name": "name",
            "nullable": false,
            "scalar": true,
            "type": "String",
          },
          "updatedAt": Object {
            "directives": Object {},
            "list": false,
            "name": "updatedAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "users": Object {
            "directives": Object {
              "type": Object {
                "keys": Array [
                  "clubId",
                  "userId",
                ],
                "name": "ClubToUser",
              },
            },
            "list": true,
            "name": "users",
            "nullable": false,
            "scalar": false,
            "type": "User",
          },
          "version": Object {
            "directives": Object {},
            "list": false,
            "name": "version",
            "nullable": false,
            "scalar": true,
            "type": "Int",
          },
        },
        "name": "Club",
      },
      "ClubToUser": Object {
        "directives": Object {
          "join": Object {},
        },
        "fields": Object {
          "clubId": Object {
            "directives": Object {
              "ref": Object {
                "name": "Club",
              },
            },
            "list": false,
            "name": "clubId",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "createdAt": Object {
            "directives": Object {},
            "list": false,
            "name": "createdAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "id": Object {
            "directives": Object {},
            "list": false,
            "name": "id",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "updatedAt": Object {
            "directives": Object {},
            "list": false,
            "name": "updatedAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "userId": Object {
            "directives": Object {
              "ref": Object {
                "name": "User",
              },
            },
            "list": false,
            "name": "userId",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "version": Object {
            "directives": Object {},
            "list": false,
            "name": "version",
            "nullable": false,
            "scalar": true,
            "type": "Int",
          },
        },
        "name": "ClubToUser",
      },
      "Mutation": Object {
        "directives": Object {},
        "fields": Object {
          "create": Object {
            "directives": Object {},
            "list": false,
            "name": "create",
            "nullable": false,
            "scalar": false,
            "type": "Query",
          },
          "delete": Object {
            "directives": Object {},
            "list": false,
            "name": "delete",
            "nullable": false,
            "scalar": false,
            "type": "Query",
          },
          "read": Object {
            "directives": Object {},
            "list": false,
            "name": "read",
            "nullable": false,
            "scalar": false,
            "type": "Query",
          },
          "update": Object {
            "directives": Object {},
            "list": false,
            "name": "update",
            "nullable": false,
            "scalar": false,
            "type": "Query",
          },
        },
        "name": "Mutation",
      },
      "Profile": Object {
        "directives": Object {},
        "fields": Object {
          "age": Object {
            "directives": Object {},
            "list": false,
            "name": "age",
            "nullable": true,
            "scalar": true,
            "type": "Int",
          },
          "createdAt": Object {
            "directives": Object {},
            "list": false,
            "name": "createdAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "id": Object {
            "directives": Object {},
            "list": false,
            "name": "id",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "updatedAt": Object {
            "directives": Object {},
            "list": false,
            "name": "updatedAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "user": Object {
            "directives": Object {
              "key": Object {
                "name": "userId",
              },
            },
            "list": false,
            "name": "user",
            "nullable": true,
            "scalar": false,
            "type": "User",
          },
          "userId": Object {
            "directives": Object {
              "ref": Object {
                "name": "User",
              },
              "unique": Object {},
            },
            "list": false,
            "name": "userId",
            "nullable": true,
            "scalar": true,
            "type": "UUID",
          },
          "version": Object {
            "directives": Object {},
            "list": false,
            "name": "version",
            "nullable": false,
            "scalar": true,
            "type": "Int",
          },
        },
        "name": "Profile",
      },
      "Query": Object {
        "directives": Object {},
        "fields": Object {
          "class": Object {
            "directives": Object {},
            "list": false,
            "name": "class",
            "nullable": true,
            "scalar": false,
            "type": "Class",
          },
          "classes": Object {
            "directives": Object {},
            "list": true,
            "name": "classes",
            "nullable": false,
            "scalar": false,
            "type": "Class",
          },
          "club": Object {
            "directives": Object {},
            "list": false,
            "name": "club",
            "nullable": true,
            "scalar": false,
            "type": "Club",
          },
          "clubs": Object {
            "directives": Object {},
            "list": true,
            "name": "clubs",
            "nullable": false,
            "scalar": false,
            "type": "Club",
          },
          "profile": Object {
            "directives": Object {},
            "list": false,
            "name": "profile",
            "nullable": true,
            "scalar": false,
            "type": "Profile",
          },
          "profiles": Object {
            "directives": Object {},
            "list": true,
            "name": "profiles",
            "nullable": false,
            "scalar": false,
            "type": "Profile",
          },
          "user": Object {
            "directives": Object {},
            "list": false,
            "name": "user",
            "nullable": true,
            "scalar": false,
            "type": "User",
          },
          "users": Object {
            "directives": Object {},
            "list": true,
            "name": "users",
            "nullable": false,
            "scalar": false,
            "type": "User",
          },
        },
        "name": "Query",
      },
      "User": Object {
        "directives": Object {},
        "fields": Object {
          "class": Object {
            "directives": Object {
              "key": Object {
                "name": "classId",
              },
            },
            "list": false,
            "name": "class",
            "nullable": true,
            "scalar": false,
            "type": "Class",
          },
          "classId": Object {
            "directives": Object {
              "ref": Object {
                "name": "Class",
              },
            },
            "list": false,
            "name": "classId",
            "nullable": true,
            "scalar": true,
            "type": "UUID",
          },
          "clubs": Object {
            "directives": Object {
              "type": Object {
                "keys": Array [
                  "userId",
                  "clubId",
                ],
                "name": "ClubToUser",
              },
            },
            "list": true,
            "name": "clubs",
            "nullable": false,
            "scalar": false,
            "type": "Club",
          },
          "createdAt": Object {
            "directives": Object {},
            "list": false,
            "name": "createdAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "id": Object {
            "directives": Object {},
            "list": false,
            "name": "id",
            "nullable": false,
            "scalar": true,
            "type": "UUID",
          },
          "name": Object {
            "directives": Object {},
            "list": false,
            "name": "name",
            "nullable": false,
            "scalar": true,
            "type": "String",
          },
          "profile": Object {
            "directives": Object {
              "field": Object {
                "key": "userId",
                "name": "user",
              },
            },
            "list": false,
            "name": "profile",
            "nullable": true,
            "scalar": false,
            "type": "Profile",
          },
          "updatedAt": Object {
            "directives": Object {},
            "list": false,
            "name": "updatedAt",
            "nullable": false,
            "scalar": true,
            "type": "Date",
          },
          "version": Object {
            "directives": Object {},
            "list": false,
            "name": "version",
            "nullable": false,
            "scalar": true,
            "type": "Int",
          },
        },
        "name": "User",
      },
    }
  `);
});
