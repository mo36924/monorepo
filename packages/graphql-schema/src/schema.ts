import { createObject } from "@mo36924/util";
import { buildSchema as _buildSchema, Source } from "graphql";
import { schemaDirectives } from "./directives";
import { baseFields, baseJoinTypeFields } from "./fields";
import { format } from "./format";
import { buildModel } from "./model";
import { comparisonOperators, ComparisonOperators, LogicalOperators } from "./operators";
import { customScalars, primaryKeyTypeName, scalarTypeNames } from "./scalars";
import { printDirectives, printFieldType, sortTypes, Types } from "./types";
import {
  getFieldName,
  getJoinTypeName,
  getKeyFieldName,
  getKeyFieldNames,
  getListFieldName,
  getOrderName,
  getTypeName,
} from "./util";

export type Where<T extends string = "field1" | "field2" | "field3"> = {
  [U in T | LogicalOperators]?: U extends LogicalOperators
    ? Where<T> | undefined
    : { [V in ComparisonOperators]?: any };
};

const fixSchemaTypes = (types: Types) => {
  for (const [typeName, type] of Object.entries(types)) {
    for (const [fieldName, field] of Object.entries(type.fields)) {
      if (field.scalar) {
        continue;
      }

      const directives = field.directives;
      const { key: keyDirective, type: typeDirective, field: fieldDirective } = directives;

      if (keyDirective) {
        continue;
      }

      if (typeDirective) {
        typeDirective.keys = getKeyFieldNames(typeName, field.type);
        const joinTypeName = typeDirective.name;

        if (types[joinTypeName]) {
          continue;
        }

        const typeNames = [typeName, field.type].sort();
        const keys = getKeyFieldNames(typeNames[0], typeNames[1]);

        types[joinTypeName] = {
          name: joinTypeName,
          directives: { join: {} },
          fields: createObject({
            [keys[0]]: {
              name: keys[0],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: { name: typeNames[0] },
              },
            },
            [keys[1]]: {
              name: keys[1],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: { name: typeNames[1] },
              },
            },
          }),
        };

        continue;
      }

      if (fieldDirective) {
        const refTypeFieldName = fieldDirective.name;
        const refTypeFields = types[field.type].fields;
        const keyFieldName = getKeyFieldName(refTypeFieldName);
        fieldDirective.key = keyFieldName;

        if (refTypeFields[keyFieldName]?.directives.ref) {
          continue;
        }

        const nullable = refTypeFields[refTypeFieldName]?.nullable ?? true;

        refTypeFields[refTypeFieldName] = {
          name: refTypeFieldName,
          type: typeName,
          list: false,
          nullable: nullable,
          scalar: false,
          directives: {
            key: {
              name: keyFieldName,
            },
          },
        };

        refTypeFields[keyFieldName] = {
          name: keyFieldName,
          type: primaryKeyTypeName,
          list: false,
          nullable: nullable,
          scalar: true,
          directives: {
            ref: { name: typeName },
            ...(field.list ? {} : { unique: {} }),
          },
        };

        continue;
      }

      if (getTypeName(fieldName) !== field.type) {
        continue;
      }

      const refTypeName = field.type;
      const refType = types[refTypeName];
      const refTypeFields = refType.fields;
      const refListField = refTypeFields[getListFieldName(typeName)];
      const fieldIsList = field.list;
      const refFieldIsList = refListField?.list ?? false;

      // *:*
      if (fieldIsList && refFieldIsList) {
        const typeNames = [typeName, refTypeName].sort();
        const joinTypeName = getJoinTypeName(typeName, refTypeName);

        if (types[joinTypeName]) {
          continue;
        }

        directives.type = {
          name: joinTypeName,
          keys: getKeyFieldNames(typeName, refTypeName),
        };

        refListField.directives.type = {
          name: joinTypeName,
          keys: getKeyFieldNames(refTypeName, typeName),
        };

        const keyFieldNames = getKeyFieldNames(typeNames[0], typeNames[1]);

        types[joinTypeName] = {
          name: joinTypeName,
          directives: { join: {} },
          fields: createObject({
            [keyFieldNames[0]]: {
              name: keyFieldNames[0],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: {
                  name: typeNames[0],
                },
              },
            },
            [keyFieldNames[1]]: {
              name: keyFieldNames[1],
              type: primaryKeyTypeName,
              list: false,
              nullable: false,
              scalar: true,
              directives: {
                ref: {
                  name: typeNames[1],
                },
              },
            },
          }),
        };

        continue;
      }

      // 1:*
      if (fieldIsList && !refFieldIsList) {
        const refNonListFieldName = getFieldName(typeName);
        const keyFieldName = getKeyFieldName(typeName);

        directives.field = {
          name: refNonListFieldName,
          key: keyFieldName,
        };

        refTypeFields[refNonListFieldName] = {
          name: refNonListFieldName,
          type: typeName,
          list: false,
          nullable: true,
          scalar: false,
          directives: {
            key: {
              name: keyFieldName,
            },
          },
        };

        refTypeFields[keyFieldName] = {
          name: keyFieldName,
          type: primaryKeyTypeName,
          list: false,
          nullable: true,
          scalar: true,
          directives: {
            ref: {
              name: typeName,
            },
          },
        };

        continue;
      }

      // 1:1
      if (!fieldIsList && !refFieldIsList) {
        if (field.nullable) {
          const refNonListFieldName = getFieldName(typeName);
          const keyFieldName = getKeyFieldName(typeName);

          directives.field = {
            name: refNonListFieldName,
            key: keyFieldName,
          };

          refTypeFields[refNonListFieldName] = {
            name: refNonListFieldName,
            type: typeName,
            list: false,
            nullable: true,
            scalar: false,
            directives: {
              key: { name: keyFieldName },
            },
          };

          refTypeFields[keyFieldName] = {
            name: keyFieldName,
            type: primaryKeyTypeName,
            list: false,
            nullable: true,
            scalar: true,
            directives: {
              ref: {
                name: typeName,
              },
              unique: {},
            },
          };
        } else {
          const refNonListFieldName = getFieldName(typeName);
          const keyFieldName = getKeyFieldName(refTypeName);

          refTypeFields[refNonListFieldName] = {
            name: refNonListFieldName,
            type: typeName,
            list: false,
            nullable: true,
            scalar: false,
            directives: {
              field: { name: fieldName, key: keyFieldName },
            },
          };

          directives.key = {
            name: keyFieldName,
          };

          type.fields[keyFieldName] = {
            name: keyFieldName,
            type: primaryKeyTypeName,
            list: false,
            nullable: false,
            scalar: true,
            directives: {
              ref: {
                name: refTypeName,
              },
              unique: {},
            },
          };
        }

        continue;
      }
    }
  }

  types = sortTypes(types);

  for (const type of Object.values(types)) {
    if (type.directives.join) {
      type.fields = createObject({ ...baseJoinTypeFields, ...type.fields });
    } else {
      type.fields = createObject({ ...baseFields, ...type.fields });
    }
  }

  return types;
};

const printSchema = (types: Types) => {
  let schema = `scalar Unknown\n${customScalars}${schemaDirectives}`;
  let query = "";
  let mutation = "";
  let objectType = "";
  let whereInput = "";
  let orderInput = "";
  let createData = "";
  let updateData = "";
  let deleteData = "";
  let createInput = "";
  let updateInput = "";
  let deleteInput = "";

  query += `type Query {`;

  mutation += `type Mutation {
    create(data: CreateData!): Query!
    update(data: UpdateData!): Query!
    delete(data: DeleteData!): Query!
  `;

  createData += `input CreateData {`;
  updateData += `input UpdateData {`;
  deleteData += `input DeleteData {`;

  for (const [typeName, type] of Object.entries(types)) {
    const { fields, directives } = type;
    const typeDirectives = printDirectives(directives);
    objectType += `type ${typeName} ${typeDirectives} {`;

    for (const [fieldName, field] of Object.entries(fields)) {
      const { list, type: fieldTypeName } = field;
      const fieldType = printFieldType(field);
      const fieldDirectives = printDirectives(field.directives);

      if (list) {
        objectType += `${fieldName}(where: Where${fieldTypeName}, order: [Order${fieldTypeName}!], limit: Int, offset: Int): ${fieldType} ${fieldDirectives}\n`;
      } else {
        objectType += `${fieldName}: ${fieldType} ${fieldDirectives}\n`;
      }
    }

    objectType += `}`;
  }

  for (const [typeName, type] of Object.entries(types)) {
    const { fields, directives } = type;

    if (directives.join) {
      continue;
    }

    const fieldName = getFieldName(typeName);
    const fieldListName = getListFieldName(fieldName);

    query += `
      ${fieldName}(where: Where${typeName}, order: [Order${typeName}!], offset: Int): ${typeName}
      ${fieldListName}(where: Where${typeName}, order: [Order${typeName}!], limit: Int, offset: Int): [${typeName}!]!
    `;

    createData += `
      ${fieldName}: CreateData${typeName}
      ${fieldListName}: [CreateData${typeName}!]
    `;

    updateData += `
      ${fieldName}: UpdateData${typeName}
      ${fieldListName}: [UpdateData${typeName}!]
    `;

    deleteData += `
      ${fieldName}: DeleteData${typeName}
      ${fieldListName}: [DeleteData${typeName}!]
    `;

    createInput += `input CreateData${typeName} {`;
    updateInput += `input UpdateData${typeName} {`;
    deleteInput += `input DeleteData${typeName} {`;
    whereInput += `input Where${typeName} {`;
    orderInput += `enum Order${typeName} {`;

    for (const [fieldName, field] of Object.entries(fields)) {
      const {
        list,
        type: fieldTypeName,
        scalar,
        directives: { ref },
      } = field;

      if (!scalar) {
        if (list) {
          createInput += `${fieldName}: [CreateData${fieldTypeName}!]\n`;
          updateInput += `${fieldName}: [UpdateData${fieldTypeName}!]\n`;
          deleteInput += `${fieldName}: [DeleteData${fieldTypeName}!]\n`;
        } else {
          createInput += `${fieldName}: CreateData${fieldTypeName}\n`;
          updateInput += `${fieldName}: UpdateData${fieldTypeName}\n`;
          deleteInput += `${fieldName}: DeleteData${fieldTypeName}\n`;
        }

        continue;
      }

      if (!ref) {
        const fieldType = printFieldType(field);

        switch (fieldName) {
          case "id":
            updateInput += `${fieldName}: ${fieldType}\n`;
            deleteInput += `${fieldName}: ${fieldType}\n`;
            break;
          case "version":
            updateInput += `${fieldName}: ${fieldType}\n`;
            deleteInput += `${fieldName}: ${fieldType}\n`;
            break;
          case "createdAt":
          case "updatedAt":
          case "isDeleted":
            break;
          default:
            createInput += `${fieldName}: ${fieldType}\n`;
            updateInput += `${fieldName}: ${printFieldType({ ...field, nullable: true })}\n`;
            break;
        }
      }

      whereInput += `${fieldName}: ${printFieldType({ type: `Where${fieldTypeName}`, list: false, nullable: true })}\n`;

      const FIELD_NAME = getOrderName(fieldName);

      orderInput += `
        ${FIELD_NAME}_ASC
        ${FIELD_NAME}_DESC
      `;

      if (field.nullable) {
        orderInput += `
          ${FIELD_NAME}_ASC_NULLS_FIRST
          ${FIELD_NAME}_ASC_NULLS_LAST
          ${FIELD_NAME}_DESC_NULLS_FIRST
          ${FIELD_NAME}_DESC_NULLS_LAST
        `;
      }
    }

    createInput += `}`;
    updateInput += `}`;
    deleteInput += `}`;

    whereInput += `
      and: Where${typeName}
      or: Where${typeName}
      not: Where${typeName}
    }`;

    orderInput += `}`;
  }

  for (const scalarType of scalarTypeNames) {
    if (scalarType === "ID") {
      continue;
    }

    whereInput += `input Where${scalarType} {`;

    for (const comparisonOperator of comparisonOperators) {
      if (scalarType === "Boolean" && comparisonOperator !== "eq" && comparisonOperator !== "ne") {
        continue;
      }

      if (comparisonOperator === "in") {
        whereInput += `${comparisonOperator}: [${scalarType}]\n`;
      } else if (comparisonOperator === "like") {
        whereInput += `${comparisonOperator}: String\n`;
      } else {
        whereInput += `${comparisonOperator}: ${scalarType}\n`;
      }
    }

    whereInput += `}`;
  }

  query += `}`;
  mutation += `}`;
  createData += `}`;
  updateData += `}`;
  deleteData += `}`;

  schema +=
    query +
    mutation +
    objectType +
    createData +
    updateData +
    deleteData +
    createInput +
    updateInput +
    deleteInput +
    whereInput +
    orderInput;

  schema = format(schema);
  return schema;
};

const buildGraphQL = (graphql: string | Source) => {
  let types = buildModel(graphql);
  types = fixSchemaTypes(types);
  graphql = printSchema(types);
  const schema = _buildSchema(graphql);
  return { graphql, types, schema };
};

export const fixSchema = (graphql: string | Source) => {
  return buildGraphQL(graphql).graphql;
};

export const buildSchemaTypes = (graphql: string | Source) => {
  return buildGraphQL(graphql).types;
};

export const buildSchema = (graphql: string | Source) => {
  return buildGraphQL(graphql).schema;
};
