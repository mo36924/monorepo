import { createObject } from "@mo36924/util";
import { GraphQLObjectType, GraphQLScalarType, GraphQLSchema, isObjectType } from "graphql";
import { getDirectives } from "./directives";
import { FieldDefInfo, getFieldDefInfo } from "./info";
import type { ScalarUnionTypeNames } from "./scalars";

const uuid = (value: number, tableIndex: number) =>
  `00000000-0000-4000-a000-${tableIndex.toString().padStart(4, "0")}${value.toString().padStart(8, "0")}`;

const defaultScalarValues: { [key: string]: any } = createObject<[{ [key in ScalarUnionTypeNames]: any }]>({
  ID: "",
  Int: 0,
  Float: 0,
  String: "",
  Boolean: true,
  UUID: "",
  Date: new Date(0),
});

export const buildTestData = (schema: GraphQLSchema, baseRecordCount = 3) => {
  const excludeObjectTypes = [schema.getQueryType(), schema.getMutationType(), schema.getSubscriptionType()];
  const types: { [typeName: string]: GraphQLObjectType } = Object.create(null);

  for (const [typeName, type] of Object.entries(schema.getTypeMap())) {
    if (isObjectType(type) && !excludeObjectTypes.includes(type) && !type.name.startsWith("__")) {
      types[typeName] = type;
    }
  }

  const recordCounts: { [typeName: string]: number } = Object.create(null);

  const getRecordCount = (dep: string, deps: string[] = []): number => {
    if (deps.includes(dep)) {
      return 0;
    }

    if (recordCounts[dep]) {
      return recordCounts[dep];
    }

    const recordCount = Math.max(
      baseRecordCount,
      ...Object.values(types[dep].getFields())
        .map(({ astNode }) => getDirectives(astNode!))
        .map(({ ref, unique }) =>
          ref ? getRecordCount(ref.name, [dep, ...deps]) * (unique ? 1 : baseRecordCount) : 0,
        ),
    );

    recordCounts[dep] = recordCount;
    return recordCount;
  };

  const dataTypes: { [typeName: string]: { typeIndex: number; recordCount: number } } = Object.create(null);

  Object.keys(types).forEach((typeName, typeIndex) => {
    dataTypes[typeName] = { typeIndex, recordCount: getRecordCount(typeName) };
  });

  return Object.entries(types).map(([typeName, type]) => {
    const { recordCount, typeIndex } = dataTypes[typeName];

    const fieldDefInfos = Object.values(type.getFields())
      .map((field) => getFieldDefInfo(schema, type, field.name))
      .filter((info): info is FieldDefInfo & { type: GraphQLScalarType; scalar: true } => info.scalar);

    return {
      typeName,
      typeIndex,
      recordCount,
      fieldNames: fieldDefInfos.map(({ name }) => name),
      values: [...Array(recordCount).keys()].map((i) =>
        fieldDefInfos.map((info) => {
          const {
            name: fieldName,
            type: { name: fieldTypeName },
            directives: { ref },
          } = info;

          const defaultValue = defaultScalarValues[fieldTypeName];
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

          return { ...info, value };
        }),
      ),
    };
  });
};
