import { buildSchemaTypes, Type, Types } from "@mo36924/graphql-schema";
import { createObject, createObjectNull } from "@mo36924/util";

export type DataTypes = { [typeName: string]: DataType };
export type DataType = Type & { typeIndex: number; recordCount: number };

const getRecordCountFactory = (types: Types, baseRecordCount: number) => {
  const recordCounts = createObjectNull<{ [typeName: string]: number }>();

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

  return getRecordCount;
};

const uuid = (value: number, tableIndex: number) =>
  `00000000-0000-4000-a000-${tableIndex.toString().padStart(4, "0")}${value.toString().padStart(8, "0")}`;

const defaultScalarValues = createObject<[{ [key: string]: any }]>({
  ID: "",
  Int: 0,
  Float: 0,
  String: "",
  Boolean: true,
  UUID: "",
  Date: new Date(0),
});

export const buildData = (graphql: string, baseRecordCount = 3) => {
  const types = buildSchemaTypes(graphql);
  const getRecordCount = getRecordCountFactory(types, baseRecordCount);
  const dataTypes = createObjectNull<DataTypes>();

  Object.entries(types).forEach(([name, type], typeIndex) => {
    dataTypes[name] = { ...type, typeIndex, recordCount: getRecordCount(name) };
  });

  return Object.entries(dataTypes).map(([typeName, dataType]) => {
    const { fields, recordCount, typeIndex } = dataType;
    const fieldEntries = Object.entries(fields).filter(([, { scalar }]) => scalar);
    const fieldNames = fieldEntries.map(([fieldName]) => fieldName);

    return {
      typeName,
      dataType,
      fieldNames,
      values: [...Array(recordCount).keys()].map((i) =>
        fieldEntries.map(([fieldName, field]) => {
          const {
            type,
            directives: { ref },
          } = field;

          const defaultValue = defaultScalarValues[type];
          let value: any;

          if (fieldName === "id") {
            value = uuid(i + 1, typeIndex);
          } else if (fieldName === "version") {
            value = 1;
          } else if (fieldName === "isDeleted") {
            value = false;
          } else if (ref) {
            const { recordCount, typeIndex } = dataTypes[ref.name];
            value = uuid((i % recordCount) + 1, typeIndex);
          } else if (typeof defaultValue === "string") {
            value = `${fieldName}-${i + 1}`;
          } else {
            value = defaultValue;
          }

          return { fieldName, field, value };
        }),
      ),
    };
  });
};
