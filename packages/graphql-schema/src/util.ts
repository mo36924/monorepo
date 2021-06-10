import { camelCase, constantCase, pascalCase } from "change-case";
import pluralize from "pluralize";
import { baseFieldNames } from "./fields";
import { logicalOperators } from "./operators";
import { primaryKeyTypeName, scalarTypeNames } from "./scalars";

const { plural, singular } = pluralize;

export const getTypeName = (name: string) => {
  name = pascalCase(singular(name));
  const upperCaseName = name.toUpperCase();

  if (upperCaseName === "ID" || upperCaseName === "UUID") {
    return primaryKeyTypeName;
  }

  return name;
};

export const getJoinTypeName = (name1: string, name2?: string): string => {
  if (name2 != null) {
    return [name1, name2].map(getTypeName).sort().join("To");
  }

  const name = getTypeName(name1);
  const names = name.split("To");
  return names.length === 2 ? getJoinTypeName(names[0], names[1]) : name;
};

export const reservedTypeNames = [...scalarTypeNames, ...logicalOperators.map(getTypeName)];
export const isReservedTypeName = (name: string) => reservedTypeNames.includes(name);
export const getFieldName = (name: string) => camelCase(singular(name));
export const getListFieldName = (name: string) => camelCase(plural(name));
export const getKeyFieldName = (name: string) => getFieldName(name).replace(/(Id)*$/, "Id");
export const getKeyFieldNames = (name1: string, name2: string): [string, string] => [
  getKeyFieldName(name1),
  getKeyFieldName(name2),
];
export const reservedFieldNames = [...baseFieldNames, ...logicalOperators];
export const isReservedFieldName = (name: string) => reservedFieldNames.includes(name);
export const getOrderName = (name: string) => constantCase(name);
