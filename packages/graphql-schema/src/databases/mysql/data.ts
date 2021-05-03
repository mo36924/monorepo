import { escape, escapeId } from "@mo36924/mysql-escape";
import { getTypes, Types } from "../../types";
import { createObject } from "../../utils";

export const data = (schema: string) => {
  const { Query, Mutation, ...types } = getTypes(schema);
  let sql = "";
  sql += disableForeignKeyCheck();
  sql += getInsertQueries(types);
  sql += enableForeignKeyCheck();
  return sql;
};

const disableForeignKeyCheck = () => "set foreign_key_checks=0;\n";
const enableForeignKeyCheck = () => "set foreign_key_checks=1;\n";

const uuid = (value: number, tableIndex: number) =>
  "00000000-0000-4000-a000-" + tableIndex.toString().padStart(6, "0") + value.toString().padStart(6, "0");

const defaultScalarValues = createObject<{ [key: string]: any }>({
  ID: "",
  Int: 0,
  Float: 0,
  String: "",
  Boolean: true,
  Date: new Date(0),
});

const getInsertQueries = (types: Types, baseRecordCount = 3) => {
  const tableIndexes = Object.fromEntries(Object.keys(types).map((typeName, index) => [typeName, index]));
  const recordCounts = createObject<{ [typeName: string]: number }>();

  const getRecordCount = (dep: string, deps: string[] = []): number => {
    if (deps.includes(dep)) {
      return 0;
    }

    if (recordCounts[dep]) {
      return recordCounts[dep];
    }

    const fields = types[dep].fields;

    const recordCount = Math.max(
      baseRecordCount,
      ...Object.values(fields).map(({ directives: { ref, unique } }) =>
        ref ? getRecordCount(ref.name, [dep, ...deps]) * (unique ? 1 : baseRecordCount) : 0,
      ),
    );

    recordCounts[dep] = recordCount;
    return recordCount;
  };

  const getInsertQuery = (typeName: string) => {
    const recordCount = getRecordCount(typeName);
    const fieldEntries = Object.entries(types[typeName].fields).filter(([, field]) => field.scalar);
    const fieldNames = fieldEntries.map(([fieldName]) => escapeId(fieldName));
    const valuesList: string[] = [];

    for (let i = 0; i < recordCount; i++) {
      const values: string[] = [];

      for (const [fieldName, field] of fieldEntries) {
        const {
          type: fieldType,
          directives: { ref },
        } = field;

        const defaultValue = defaultScalarValues[fieldType];
        let value: any;

        if (fieldName === "id") {
          value = uuid(i + 1, tableIndexes[typeName]);
        } else if (fieldName === "version") {
          value = 1;
        } else if (fieldName === "isDeleted") {
          value = false;
        } else if (ref) {
          value = uuid((i % getRecordCount(ref.name)) + 1, tableIndexes[ref.name]);
        } else if (typeof defaultValue === "string") {
          value = `${fieldName}-${i + 1}`;
        } else {
          value = defaultValue;
        }

        if (fieldType === "ID" || fieldType === "UUID") {
          values.push(`uuid_to_bin(${escape(value)})`);
        } else {
          values.push(escape(value));
        }
      }

      valuesList.push(`(${values.join()})`);
    }

    return `insert into ${escapeId(typeName)} (${fieldNames.join()}) values \n${valuesList.join(",\n")};\n`;
  };

  return Object.keys(types).map(getInsertQuery).join("");
};
