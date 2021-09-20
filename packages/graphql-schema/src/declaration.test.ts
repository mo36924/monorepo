import { expect, it } from "@jest/globals";
import { raw } from "@mo36924/jest-snapshot-serializer-raw";
import { buildDeclaration } from "./declaration";
import { buildSchemaModel } from "./schema";

it("buildDeclaration", () => {
  const schema = buildSchemaModel(`
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

  const declaration = buildDeclaration(schema);

  expect(raw(declaration)).toMatchInlineSnapshot(`
    export type {};
    declare global {
      namespace GraphQL {
        export type CreateData = {
          class?: CreateDataClass | null;
          classes?: CreateDataClass[] | null;
          club?: CreateDataClub | null;
          clubs?: CreateDataClub[] | null;
          profile?: CreateDataProfile | null;
          profiles?: CreateDataProfile[] | null;
          user?: CreateDataUser | null;
          users?: CreateDataUser[] | null;
        };
        export type UpdateData = {
          class?: UpdateDataClass | null;
          classes?: UpdateDataClass[] | null;
          club?: UpdateDataClub | null;
          clubs?: UpdateDataClub[] | null;
          profile?: UpdateDataProfile | null;
          profiles?: UpdateDataProfile[] | null;
          user?: UpdateDataUser | null;
          users?: UpdateDataUser[] | null;
        };
        export type DeleteData = {
          class?: DeleteDataClass | null;
          classes?: DeleteDataClass[] | null;
          club?: DeleteDataClub | null;
          clubs?: DeleteDataClub[] | null;
          profile?: DeleteDataProfile | null;
          profiles?: DeleteDataProfile[] | null;
          user?: DeleteDataUser | null;
          users?: DeleteDataUser[] | null;
        };
        export type CreateDataClass = {
          name: string;
          users?: CreateDataUser[] | null;
        };
        export type CreateDataClub = {
          name: string;
          users?: CreateDataUser[] | null;
        };
        export type CreateDataProfile = {
          age?: number | null;
          user?: CreateDataUser | null;
        };
        export type CreateDataUser = {
          class?: CreateDataClass | null;
          clubs?: CreateDataClub[] | null;
          name: string;
          profile?: CreateDataProfile | null;
        };
        export type UpdateDataClass = {
          id: string;
          version: number;
          name?: string | null;
          users?: UpdateDataUser[] | null;
        };
        export type UpdateDataClub = {
          id: string;
          version: number;
          name?: string | null;
          users?: UpdateDataUser[] | null;
        };
        export type UpdateDataProfile = {
          id: string;
          version: number;
          age?: number | null;
          user?: UpdateDataUser | null;
        };
        export type UpdateDataUser = {
          id: string;
          version: number;
          class?: UpdateDataClass | null;
          clubs?: UpdateDataClub[] | null;
          name?: string | null;
          profile?: UpdateDataProfile | null;
        };
        export type DeleteDataClass = {
          id: string;
          version: number;
          users?: DeleteDataUser[] | null;
        };
        export type DeleteDataClub = {
          id: string;
          version: number;
          users?: DeleteDataUser[] | null;
        };
        export type DeleteDataProfile = {
          id: string;
          version: number;
          user?: DeleteDataUser | null;
        };
        export type DeleteDataUser = {
          id: string;
          version: number;
          class?: DeleteDataClass | null;
          clubs?: DeleteDataClub[] | null;
          profile?: DeleteDataProfile | null;
        };
        export type WhereClass = {
          id?: WhereUUID | null;
          version?: WhereInt | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          isDeleted?: boolean | null;
          name?: WhereString | null;
          and?: WhereClass | null;
          or?: WhereClass | null;
          not?: WhereClass | null;
        };
        export type WhereClub = {
          id?: WhereUUID | null;
          version?: WhereInt | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          isDeleted?: boolean | null;
          name?: WhereString | null;
          and?: WhereClub | null;
          or?: WhereClub | null;
          not?: WhereClub | null;
        };
        export type WhereProfile = {
          id?: WhereUUID | null;
          version?: WhereInt | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          isDeleted?: boolean | null;
          age?: WhereInt | null;
          userId?: WhereUUID | null;
          and?: WhereProfile | null;
          or?: WhereProfile | null;
          not?: WhereProfile | null;
        };
        export type WhereUser = {
          id?: WhereUUID | null;
          version?: WhereInt | null;
          createdAt?: WhereDate | null;
          updatedAt?: WhereDate | null;
          isDeleted?: boolean | null;
          classId?: WhereUUID | null;
          name?: WhereString | null;
          and?: WhereUser | null;
          or?: WhereUser | null;
          not?: WhereUser | null;
        };
        export type WhereInt = {
          eq?: number | null;
          ne?: number | null;
          gt?: number | null;
          lt?: number | null;
          ge?: number | null;
          le?: number | null;
          in?: number[] | null;
          like?: string | null;
        };
        export type WhereFloat = {
          eq?: number | null;
          ne?: number | null;
          gt?: number | null;
          lt?: number | null;
          ge?: number | null;
          le?: number | null;
          in?: number[] | null;
          like?: string | null;
        };
        export type WhereString = {
          eq?: string | null;
          ne?: string | null;
          gt?: string | null;
          lt?: string | null;
          ge?: string | null;
          le?: string | null;
          in?: string[] | null;
          like?: string | null;
        };
        export type WhereBoolean = {
          eq?: boolean | null;
          ne?: boolean | null;
        };
        export type WhereUUID = {
          eq?: string | null;
          ne?: string | null;
          gt?: string | null;
          lt?: string | null;
          ge?: string | null;
          le?: string | null;
          in?: string[] | null;
          like?: string | null;
        };
        export type WhereDate = {
          eq?: Date | null;
          ne?: Date | null;
          gt?: Date | null;
          lt?: Date | null;
          ge?: Date | null;
          le?: Date | null;
          in?: Date[] | null;
          like?: string | null;
        };
      }
    }

  `);
});
