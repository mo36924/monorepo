import { camelCase, constantCase, pascalCase } from "change-case";
import { plural, singular } from "pluralize";

export const createObject = <T extends {} = any>(obj?: T): T => {
  return Object.assign(Object.create(null), obj);
};

export const getTypeName = (typeName: string) =>
  typeName.toUpperCase() === "ID" ? "ID" : pascalCase(singular(typeName));
export const getJoinTypeName = (typeNames: string[]) => getTypeName(typeNames.map(getTypeName).sort().join("To"));
export const getFieldName = (fieldName: string) => camelCase(fieldName);
export const getNonListFieldName = (fieldName: string) => camelCase(singular(fieldName));
export const getListFieldName = (fieldName: string) => camelCase(plural(fieldName));
export const getKeyFieldName = (name: string) => `${getNonListFieldName(name)}Id`;
export const getOrderName = (name: string) => constantCase(name);
export const primaryKeyTypeName = "UUID";
export const customScalarTypeNames = ["UUID", "Date"];
export const scalarTypeNames = ["ID", "Int", "Float", "String", "Boolean", ...customScalarTypeNames];
export const comparisonOperators = ["eq", "ne", "gt", "lt", "ge", "le", "in", "ni", "li", "nl"];
export const isScalarTypeName = (typeName: string) => scalarTypeNames.includes(typeName);

const reviver = (_key: string, value: any) =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.assign(Object.create(null), value) : value;

export const copyTypes = <T>(value: T): T => JSON.parse(JSON.stringify(value), reviver);
