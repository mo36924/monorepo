import { describe, expect, it } from "@jest/globals";
import { raw } from "jest-snapshot-serializer-raw";
import { schema } from "./schema";
import { typescript } from "./typescript";

describe("graphql-schema", () => {
  it("generate-typescript-declaration-file", async () => {
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

    const schemaSource = schema(gql);
    const typescriptDeclarationSource = await typescript(schemaSource);

    expect(raw(typescriptDeclarationSource)).toMatchInlineSnapshot(`
      export type {};
      declare global {
        namespace GraphQL {
          type ID = string;
          type String = string;
          type Boolean = boolean;
          type Int = number;
          type Float = number;
          type UUID = string;
          type Date = globalThis.Date;
          type Maybe<T> = T | null;
          type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
          type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
          type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
          /** All built-in and custom scalars, mapped to their actual values */
          type Scalars = {
            ID: string;
            String: string;
            Boolean: boolean;
            Int: number;
            Float: number;
            UUID: string;
            Date: globalThis.Date;
          };

          type Query = {
            __typename?: "Query";
            class?: Maybe<Class>;
            classes: Array<Class>;
            club?: Maybe<Club>;
            clubs: Array<Club>;
            user?: Maybe<User>;
            users: Array<User>;
            profile?: Maybe<Profile>;
            profiles: Array<Profile>;
          };

          type QueryclassArgs = {
            where?: Maybe<WhereClass>;
            order?: Maybe<Array<OrderClass>>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryclassesArgs = {
            where?: Maybe<WhereClass>;
            order?: Maybe<Array<OrderClass>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryclubArgs = {
            where?: Maybe<WhereClub>;
            order?: Maybe<Array<OrderClub>>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryclubsArgs = {
            where?: Maybe<WhereClub>;
            order?: Maybe<Array<OrderClub>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryuserArgs = {
            where?: Maybe<WhereUser>;
            order?: Maybe<Array<OrderUser>>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryusersArgs = {
            where?: Maybe<WhereUser>;
            order?: Maybe<Array<OrderUser>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryprofileArgs = {
            where?: Maybe<WhereProfile>;
            order?: Maybe<Array<OrderProfile>>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type QueryprofilesArgs = {
            where?: Maybe<WhereProfile>;
            order?: Maybe<Array<OrderProfile>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type Mutation = {
            __typename?: "Mutation";
            create: Query;
            update: Query;
            delete: Query;
          };

          type MutationcreateArgs = {
            data: CreateData;
          };

          type MutationupdateArgs = {
            data: UpdateData;
          };

          type MutationdeleteArgs = {
            data: DeleteData;
          };

          type Class = {
            __typename?: "Class";
            id: Scalars["UUID"];
            version: Scalars["Int"];
            createdAt: Scalars["Date"];
            updatedAt: Scalars["Date"];
            isDeleted: Scalars["Boolean"];
            name: Scalars["String"];
            users: Array<User>;
          };

          type ClassusersArgs = {
            where?: Maybe<WhereUser>;
            order?: Maybe<Array<OrderUser>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type Club = {
            __typename?: "Club";
            id: Scalars["UUID"];
            version: Scalars["Int"];
            createdAt: Scalars["Date"];
            updatedAt: Scalars["Date"];
            isDeleted: Scalars["Boolean"];
            name: Scalars["String"];
            users: Array<User>;
          };

          type ClubusersArgs = {
            where?: Maybe<WhereUser>;
            order?: Maybe<Array<OrderUser>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type User = {
            __typename?: "User";
            id: Scalars["UUID"];
            version: Scalars["Int"];
            createdAt: Scalars["Date"];
            updatedAt: Scalars["Date"];
            isDeleted: Scalars["Boolean"];
            name: Scalars["String"];
            profile?: Maybe<Profile>;
            class?: Maybe<Class>;
            clubs: Array<Club>;
            classId?: Maybe<Scalars["UUID"]>;
          };

          type UserclubsArgs = {
            where?: Maybe<WhereClub>;
            order?: Maybe<Array<OrderClub>>;
            limit?: Maybe<Scalars["Int"]>;
            offset?: Maybe<Scalars["Int"]>;
          };

          type Profile = {
            __typename?: "Profile";
            id: Scalars["UUID"];
            version: Scalars["Int"];
            createdAt: Scalars["Date"];
            updatedAt: Scalars["Date"];
            isDeleted: Scalars["Boolean"];
            age?: Maybe<Scalars["Int"]>;
            user?: Maybe<User>;
            userId?: Maybe<Scalars["UUID"]>;
          };

          type ClubToUser = {
            __typename?: "ClubToUser";
            id: Scalars["UUID"];
            createdAt: Scalars["Date"];
            updatedAt: Scalars["Date"];
            isDeleted: Scalars["Boolean"];
            clubId: Scalars["UUID"];
            userId: Scalars["UUID"];
          };

          type CreateData = {
            class?: Maybe<CreateDataClass>;
            classes?: Maybe<Array<CreateDataClass>>;
            club?: Maybe<CreateDataClub>;
            clubs?: Maybe<Array<CreateDataClub>>;
            user?: Maybe<CreateDataUser>;
            users?: Maybe<Array<CreateDataUser>>;
            profile?: Maybe<CreateDataProfile>;
            profiles?: Maybe<Array<CreateDataProfile>>;
          };

          type UpdateData = {
            class?: Maybe<UpdateDataClass>;
            classes?: Maybe<Array<UpdateDataClass>>;
            club?: Maybe<UpdateDataClub>;
            clubs?: Maybe<Array<UpdateDataClub>>;
            user?: Maybe<UpdateDataUser>;
            users?: Maybe<Array<UpdateDataUser>>;
            profile?: Maybe<UpdateDataProfile>;
            profiles?: Maybe<Array<UpdateDataProfile>>;
          };

          type DeleteData = {
            class?: Maybe<DeleteDataClass>;
            classes?: Maybe<Array<DeleteDataClass>>;
            club?: Maybe<DeleteDataClub>;
            clubs?: Maybe<Array<DeleteDataClub>>;
            user?: Maybe<DeleteDataUser>;
            users?: Maybe<Array<DeleteDataUser>>;
            profile?: Maybe<DeleteDataProfile>;
            profiles?: Maybe<Array<DeleteDataProfile>>;
          };

          type CreateDataClass = {
            name: Scalars["String"];
            users?: Maybe<Array<CreateDataUser>>;
          };

          type CreateDataClub = {
            name: Scalars["String"];
            users?: Maybe<Array<CreateDataUser>>;
          };

          type CreateDataUser = {
            name: Scalars["String"];
            profile?: Maybe<CreateDataProfile>;
            class?: Maybe<CreateDataClass>;
            clubs?: Maybe<Array<CreateDataClub>>;
          };

          type CreateDataProfile = {
            age?: Maybe<Scalars["Int"]>;
            user?: Maybe<CreateDataUser>;
          };

          type UpdateDataClass = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            name?: Maybe<Scalars["String"]>;
            users?: Maybe<Array<UpdateDataUser>>;
          };

          type UpdateDataClub = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            name?: Maybe<Scalars["String"]>;
            users?: Maybe<Array<UpdateDataUser>>;
          };

          type UpdateDataUser = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            name?: Maybe<Scalars["String"]>;
            profile?: Maybe<UpdateDataProfile>;
            class?: Maybe<UpdateDataClass>;
            clubs?: Maybe<Array<UpdateDataClub>>;
          };

          type UpdateDataProfile = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            age?: Maybe<Scalars["Int"]>;
            user?: Maybe<UpdateDataUser>;
          };

          type DeleteDataClass = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            users?: Maybe<Array<DeleteDataUser>>;
          };

          type DeleteDataClub = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            users?: Maybe<Array<DeleteDataUser>>;
          };

          type DeleteDataUser = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            profile?: Maybe<DeleteDataProfile>;
            class?: Maybe<DeleteDataClass>;
            clubs?: Maybe<Array<DeleteDataClub>>;
          };

          type DeleteDataProfile = {
            id: Scalars["UUID"];
            version: Scalars["Int"];
            user?: Maybe<DeleteDataUser>;
          };

          type WhereClass = {
            id?: Maybe<WhereUUID>;
            version?: Maybe<WhereInt>;
            createdAt?: Maybe<WhereDate>;
            updatedAt?: Maybe<WhereDate>;
            isDeleted?: Maybe<WhereBoolean>;
            name?: Maybe<WhereString>;
            and?: Maybe<Array<WhereClass>>;
            or?: Maybe<Array<WhereClass>>;
            not?: Maybe<WhereClass>;
          };

          type WhereClub = {
            id?: Maybe<WhereUUID>;
            version?: Maybe<WhereInt>;
            createdAt?: Maybe<WhereDate>;
            updatedAt?: Maybe<WhereDate>;
            isDeleted?: Maybe<WhereBoolean>;
            name?: Maybe<WhereString>;
            and?: Maybe<Array<WhereClub>>;
            or?: Maybe<Array<WhereClub>>;
            not?: Maybe<WhereClub>;
          };

          type WhereUser = {
            id?: Maybe<WhereUUID>;
            version?: Maybe<WhereInt>;
            createdAt?: Maybe<WhereDate>;
            updatedAt?: Maybe<WhereDate>;
            isDeleted?: Maybe<WhereBoolean>;
            name?: Maybe<WhereString>;
            classId?: Maybe<WhereUUID>;
            and?: Maybe<Array<WhereUser>>;
            or?: Maybe<Array<WhereUser>>;
            not?: Maybe<WhereUser>;
          };

          type WhereProfile = {
            id?: Maybe<WhereUUID>;
            version?: Maybe<WhereInt>;
            createdAt?: Maybe<WhereDate>;
            updatedAt?: Maybe<WhereDate>;
            isDeleted?: Maybe<WhereBoolean>;
            age?: Maybe<WhereInt>;
            userId?: Maybe<WhereUUID>;
            and?: Maybe<Array<WhereProfile>>;
            or?: Maybe<Array<WhereProfile>>;
            not?: Maybe<WhereProfile>;
          };

          type WhereID = {
            eq?: Maybe<Scalars["ID"]>;
            ne?: Maybe<Scalars["ID"]>;
            gt?: Maybe<Scalars["ID"]>;
            lt?: Maybe<Scalars["ID"]>;
            ge?: Maybe<Scalars["ID"]>;
            le?: Maybe<Scalars["ID"]>;
            in?: Maybe<Array<Maybe<Scalars["ID"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["ID"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereInt = {
            eq?: Maybe<Scalars["Int"]>;
            ne?: Maybe<Scalars["Int"]>;
            gt?: Maybe<Scalars["Int"]>;
            lt?: Maybe<Scalars["Int"]>;
            ge?: Maybe<Scalars["Int"]>;
            le?: Maybe<Scalars["Int"]>;
            in?: Maybe<Array<Maybe<Scalars["Int"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["Int"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereFloat = {
            eq?: Maybe<Scalars["Float"]>;
            ne?: Maybe<Scalars["Float"]>;
            gt?: Maybe<Scalars["Float"]>;
            lt?: Maybe<Scalars["Float"]>;
            ge?: Maybe<Scalars["Float"]>;
            le?: Maybe<Scalars["Float"]>;
            in?: Maybe<Array<Maybe<Scalars["Float"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["Float"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereString = {
            eq?: Maybe<Scalars["String"]>;
            ne?: Maybe<Scalars["String"]>;
            gt?: Maybe<Scalars["String"]>;
            lt?: Maybe<Scalars["String"]>;
            ge?: Maybe<Scalars["String"]>;
            le?: Maybe<Scalars["String"]>;
            in?: Maybe<Array<Maybe<Scalars["String"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["String"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereBoolean = {
            gt?: Maybe<Scalars["Boolean"]>;
            lt?: Maybe<Scalars["Boolean"]>;
            ge?: Maybe<Scalars["Boolean"]>;
            le?: Maybe<Scalars["Boolean"]>;
            in?: Maybe<Array<Maybe<Scalars["Boolean"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["Boolean"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereUUID = {
            eq?: Maybe<Scalars["UUID"]>;
            ne?: Maybe<Scalars["UUID"]>;
            gt?: Maybe<Scalars["UUID"]>;
            lt?: Maybe<Scalars["UUID"]>;
            ge?: Maybe<Scalars["UUID"]>;
            le?: Maybe<Scalars["UUID"]>;
            in?: Maybe<Array<Maybe<Scalars["UUID"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["UUID"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          type WhereDate = {
            eq?: Maybe<Scalars["Date"]>;
            ne?: Maybe<Scalars["Date"]>;
            gt?: Maybe<Scalars["Date"]>;
            lt?: Maybe<Scalars["Date"]>;
            ge?: Maybe<Scalars["Date"]>;
            le?: Maybe<Scalars["Date"]>;
            in?: Maybe<Array<Maybe<Scalars["Date"]>>>;
            ni?: Maybe<Array<Maybe<Scalars["Date"]>>>;
            li?: Maybe<Scalars["String"]>;
            nl?: Maybe<Scalars["String"]>;
          };

          enum OrderClass {
            ID_ASC = "ID_ASC",
            ID_DESC = "ID_DESC",
            VERSION_ASC = "VERSION_ASC",
            VERSION_DESC = "VERSION_DESC",
            CREATED_AT_ASC = "CREATED_AT_ASC",
            CREATED_AT_DESC = "CREATED_AT_DESC",
            UPDATED_AT_ASC = "UPDATED_AT_ASC",
            UPDATED_AT_DESC = "UPDATED_AT_DESC",
            IS_DELETED_ASC = "IS_DELETED_ASC",
            IS_DELETED_DESC = "IS_DELETED_DESC",
            NAME_ASC = "NAME_ASC",
            NAME_DESC = "NAME_DESC",
          }

          enum OrderClub {
            ID_ASC = "ID_ASC",
            ID_DESC = "ID_DESC",
            VERSION_ASC = "VERSION_ASC",
            VERSION_DESC = "VERSION_DESC",
            CREATED_AT_ASC = "CREATED_AT_ASC",
            CREATED_AT_DESC = "CREATED_AT_DESC",
            UPDATED_AT_ASC = "UPDATED_AT_ASC",
            UPDATED_AT_DESC = "UPDATED_AT_DESC",
            IS_DELETED_ASC = "IS_DELETED_ASC",
            IS_DELETED_DESC = "IS_DELETED_DESC",
            NAME_ASC = "NAME_ASC",
            NAME_DESC = "NAME_DESC",
          }

          enum OrderUser {
            ID_ASC = "ID_ASC",
            ID_DESC = "ID_DESC",
            VERSION_ASC = "VERSION_ASC",
            VERSION_DESC = "VERSION_DESC",
            CREATED_AT_ASC = "CREATED_AT_ASC",
            CREATED_AT_DESC = "CREATED_AT_DESC",
            UPDATED_AT_ASC = "UPDATED_AT_ASC",
            UPDATED_AT_DESC = "UPDATED_AT_DESC",
            IS_DELETED_ASC = "IS_DELETED_ASC",
            IS_DELETED_DESC = "IS_DELETED_DESC",
            NAME_ASC = "NAME_ASC",
            NAME_DESC = "NAME_DESC",
            CLASS_ID_ASC = "CLASS_ID_ASC",
            CLASS_ID_DESC = "CLASS_ID_DESC",
            CLASS_ID_ASC_NULLS_FIRST = "CLASS_ID_ASC_NULLS_FIRST",
            CLASS_ID_ASC_NULLS_LAST = "CLASS_ID_ASC_NULLS_LAST",
            CLASS_ID_DESC_NULLS_FIRST = "CLASS_ID_DESC_NULLS_FIRST",
            CLASS_ID_DESC_NULLS_LAST = "CLASS_ID_DESC_NULLS_LAST",
          }

          enum OrderProfile {
            ID_ASC = "ID_ASC",
            ID_DESC = "ID_DESC",
            VERSION_ASC = "VERSION_ASC",
            VERSION_DESC = "VERSION_DESC",
            CREATED_AT_ASC = "CREATED_AT_ASC",
            CREATED_AT_DESC = "CREATED_AT_DESC",
            UPDATED_AT_ASC = "UPDATED_AT_ASC",
            UPDATED_AT_DESC = "UPDATED_AT_DESC",
            IS_DELETED_ASC = "IS_DELETED_ASC",
            IS_DELETED_DESC = "IS_DELETED_DESC",
            AGE_ASC = "AGE_ASC",
            AGE_DESC = "AGE_DESC",
            AGE_ASC_NULLS_FIRST = "AGE_ASC_NULLS_FIRST",
            AGE_ASC_NULLS_LAST = "AGE_ASC_NULLS_LAST",
            AGE_DESC_NULLS_FIRST = "AGE_DESC_NULLS_FIRST",
            AGE_DESC_NULLS_LAST = "AGE_DESC_NULLS_LAST",
            USER_ID_ASC = "USER_ID_ASC",
            USER_ID_DESC = "USER_ID_DESC",
            USER_ID_ASC_NULLS_FIRST = "USER_ID_ASC_NULLS_FIRST",
            USER_ID_ASC_NULLS_LAST = "USER_ID_ASC_NULLS_LAST",
            USER_ID_DESC_NULLS_FIRST = "USER_ID_DESC_NULLS_FIRST",
            USER_ID_DESC_NULLS_LAST = "USER_ID_DESC_NULLS_LAST",
          }
        }
      }

    `);
  });
});
