import { expect, it } from "@jest/globals";
import { buildASTSchema, parse } from "graphql";
import { schema } from "./schema";

it("graphql-schema", () => {
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

  const schemaGql = schema(gql);
  const documentNode = parse(schemaGql);
  buildASTSchema(documentNode);

  expect(documentNode).toMatchInlineSnapshot(`
    scalar UUID

    scalar Date

    directive @join on OBJECT

    directive @unique on FIELD_DEFINITION

    directive @key(name: String!) on FIELD_DEFINITION

    directive @ref(name: String!) on FIELD_DEFINITION

    directive @field(name: String!, key: String!) on FIELD_DEFINITION

    directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION

    type Query {
      class(where: WhereClass, order: [OrderClass!], offset: Int): Class
      classes(where: WhereClass, order: [OrderClass!], limit: Int, offset: Int): [Class!]!
      club(where: WhereClub, order: [OrderClub!], offset: Int): Club
      clubs(where: WhereClub, order: [OrderClub!], limit: Int, offset: Int): [Club!]!
      user(where: WhereUser, order: [OrderUser!], offset: Int): User
      users(where: WhereUser, order: [OrderUser!], limit: Int, offset: Int): [User!]!
      profile(where: WhereProfile, order: [OrderProfile!], offset: Int): Profile
      profiles(where: WhereProfile, order: [OrderProfile!], limit: Int, offset: Int): [Profile!]!
    }

    type Mutation {
      create(data: CreateData!): Query!
      update(data: UpdateData!): Query!
      delete(data: DeleteData!): Query!
    }

    type Class {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      isDeleted: Boolean!
      name: String!
      users(where: WhereUser, order: [OrderUser!], limit: Int, offset: Int): [User!]! @field(name: "class", key: "classId")
    }

    type Club {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      isDeleted: Boolean!
      name: String!
      users(where: WhereUser, order: [OrderUser!], limit: Int, offset: Int): [User!]! @type(name: "ClubToUser", keys: ["clubId", "userId"])
    }

    type User {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      isDeleted: Boolean!
      name: String!
      profile: Profile @field(name: "user", key: "userId")
      class: Class @key(name: "classId")
      clubs(where: WhereClub, order: [OrderClub!], limit: Int, offset: Int): [Club!]! @type(name: "ClubToUser", keys: ["userId", "clubId"])
      classId: UUID @ref(name: "Class")
    }

    type Profile {
      id: UUID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      isDeleted: Boolean!
      age: Int
      user: User @key(name: "userId")
      userId: UUID @ref(name: "User") @unique
    }

    type ClubToUser @join {
      id: UUID!
      createdAt: Date!
      updatedAt: Date!
      isDeleted: Boolean!
      clubId: UUID! @ref(name: "Club")
      userId: UUID! @ref(name: "User")
    }

    input CreateData {
      class: CreateDataClass
      classes: [CreateDataClass!]
      club: CreateDataClub
      clubs: [CreateDataClub!]
      user: CreateDataUser
      users: [CreateDataUser!]
      profile: CreateDataProfile
      profiles: [CreateDataProfile!]
    }

    input UpdateData {
      class: UpdateDataClass
      classes: [UpdateDataClass!]
      club: UpdateDataClub
      clubs: [UpdateDataClub!]
      user: UpdateDataUser
      users: [UpdateDataUser!]
      profile: UpdateDataProfile
      profiles: [UpdateDataProfile!]
    }

    input DeleteData {
      class: DeleteDataClass
      classes: [DeleteDataClass!]
      club: DeleteDataClub
      clubs: [DeleteDataClub!]
      user: DeleteDataUser
      users: [DeleteDataUser!]
      profile: DeleteDataProfile
      profiles: [DeleteDataProfile!]
    }

    input CreateDataClass {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataClub {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataUser {
      name: String!
      profile: CreateDataProfile
      class: CreateDataClass
      clubs: [CreateDataClub!]
    }

    input CreateDataProfile {
      age: Int
      user: CreateDataUser
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

    input UpdateDataUser {
      id: UUID!
      version: Int!
      name: String
      profile: UpdateDataProfile
      class: UpdateDataClass
      clubs: [UpdateDataClub!]
    }

    input UpdateDataProfile {
      id: UUID!
      version: Int!
      age: Int
      user: UpdateDataUser
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

    input DeleteDataUser {
      id: UUID!
      version: Int!
      profile: DeleteDataProfile
      class: DeleteDataClass
      clubs: [DeleteDataClub!]
    }

    input DeleteDataProfile {
      id: UUID!
      version: Int!
      user: DeleteDataUser
    }

    input WhereClass {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      isDeleted: WhereBoolean
      name: WhereString
      and: [WhereClass!]
      or: [WhereClass!]
      not: WhereClass
    }

    input WhereClub {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      isDeleted: WhereBoolean
      name: WhereString
      and: [WhereClub!]
      or: [WhereClub!]
      not: WhereClub
    }

    input WhereUser {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      isDeleted: WhereBoolean
      name: WhereString
      classId: WhereUUID
      and: [WhereUser!]
      or: [WhereUser!]
      not: WhereUser
    }

    input WhereProfile {
      id: WhereUUID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      isDeleted: WhereBoolean
      age: WhereInt
      userId: WhereUUID
      and: [WhereProfile!]
      or: [WhereProfile!]
      not: WhereProfile
    }

    input WhereID {
      eq: ID
      ne: ID
      gt: ID
      lt: ID
      ge: ID
      le: ID
      in: [ID]
      ni: [ID]
      li: String
      nl: String
    }

    input WhereInt {
      eq: Int
      ne: Int
      gt: Int
      lt: Int
      ge: Int
      le: Int
      in: [Int]
      ni: [Int]
      li: String
      nl: String
    }

    input WhereFloat {
      eq: Float
      ne: Float
      gt: Float
      lt: Float
      ge: Float
      le: Float
      in: [Float]
      ni: [Float]
      li: String
      nl: String
    }

    input WhereString {
      eq: String
      ne: String
      gt: String
      lt: String
      ge: String
      le: String
      in: [String]
      ni: [String]
      li: String
      nl: String
    }

    input WhereBoolean {
      gt: Boolean
      lt: Boolean
      ge: Boolean
      le: Boolean
      in: [Boolean]
      ni: [Boolean]
      li: String
      nl: String
    }

    input WhereUUID {
      eq: UUID
      ne: UUID
      gt: UUID
      lt: UUID
      ge: UUID
      le: UUID
      in: [UUID]
      ni: [UUID]
      li: String
      nl: String
    }

    input WhereDate {
      eq: Date
      ne: Date
      gt: Date
      lt: Date
      ge: Date
      le: Date
      in: [Date]
      ni: [Date]
      li: String
      nl: String
    }

    enum OrderClass {
      ID_ASC
      ID_DESC
      VERSION_ASC
      VERSION_DESC
      CREATED_AT_ASC
      CREATED_AT_DESC
      UPDATED_AT_ASC
      UPDATED_AT_DESC
      IS_DELETED_ASC
      IS_DELETED_DESC
      NAME_ASC
      NAME_DESC
    }

    enum OrderClub {
      ID_ASC
      ID_DESC
      VERSION_ASC
      VERSION_DESC
      CREATED_AT_ASC
      CREATED_AT_DESC
      UPDATED_AT_ASC
      UPDATED_AT_DESC
      IS_DELETED_ASC
      IS_DELETED_DESC
      NAME_ASC
      NAME_DESC
    }

    enum OrderUser {
      ID_ASC
      ID_DESC
      VERSION_ASC
      VERSION_DESC
      CREATED_AT_ASC
      CREATED_AT_DESC
      UPDATED_AT_ASC
      UPDATED_AT_DESC
      IS_DELETED_ASC
      IS_DELETED_DESC
      NAME_ASC
      NAME_DESC
      CLASS_ID_ASC
      CLASS_ID_DESC
      CLASS_ID_ASC_NULLS_FIRST
      CLASS_ID_ASC_NULLS_LAST
      CLASS_ID_DESC_NULLS_FIRST
      CLASS_ID_DESC_NULLS_LAST
    }

    enum OrderProfile {
      ID_ASC
      ID_DESC
      VERSION_ASC
      VERSION_DESC
      CREATED_AT_ASC
      CREATED_AT_DESC
      UPDATED_AT_ASC
      UPDATED_AT_DESC
      IS_DELETED_ASC
      IS_DELETED_DESC
      AGE_ASC
      AGE_DESC
      AGE_ASC_NULLS_FIRST
      AGE_ASC_NULLS_LAST
      AGE_DESC_NULLS_FIRST
      AGE_DESC_NULLS_LAST
      USER_ID_ASC
      USER_ID_DESC
      USER_ID_ASC_NULLS_FIRST
      USER_ID_ASC_NULLS_LAST
      USER_ID_DESC_NULLS_FIRST
      USER_ID_DESC_NULLS_LAST
    }

  `);
});
