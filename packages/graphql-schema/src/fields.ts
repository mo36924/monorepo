import { primaryKeyTypeName } from "./scalars";
import { buildTypes } from "./types";

const parse = (fields: string) => buildTypes(`type _{${fields}}`)._.fields;

export const baseFields = parse(`
id: ${primaryKeyTypeName}!
version: Int!
createdAt: Date!
updatedAt: Date!
isDeleted: Boolean!
`);
export const baseFieldNames = Object.keys(baseFields);
export const isBaseFieldName = (name: string) => baseFieldNames.includes(name);
