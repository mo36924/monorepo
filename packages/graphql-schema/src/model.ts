import { buildSchema } from "graphql";
import { baseTypeFields } from "./base-fields";
import { customScalars } from "./custom-scalars";
import { modelDirectives } from "./directives";
import { Field, FieldDirectives, Fields, getTypes, printTypes, Types } from "./types";
import { copyTypes, createObject, getJoinTypeName, getListFieldName, getNonListFieldName, getTypeName } from "./utils";

const deleteBaseFields = (types: Types) => {
  for (const { fields } of Object.values(types)) {
    for (const fieldName of Object.keys(fields)) {
      if (fieldName in baseTypeFields) {
        delete fields[fieldName];
      }
    }
  }

  return types;
};

const fixName = (types: Types) => {
  const _types: Types = createObject();

  // fix fieldName and fieldTypeName
  for (const [typeName, type] of Object.entries(types)) {
    const fields: Fields = createObject();

    for (const [fieldName, field] of Object.entries(type.fields)) {
      const _fieldName = field.list ? getListFieldName(fieldName) : getNonListFieldName(fieldName);
      fields[_fieldName] = { ...field, type: getTypeName(field.type) };
    }

    const _fields: Fields = createObject();

    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.scalar) {
        _fields[fieldName] = field;
        continue;
      }

      const fieldTypeName = field.type;
      const _fieldName = field.list ? getListFieldName(fieldTypeName) : getNonListFieldName(fieldTypeName);
      const __fieldName = _fieldName in fields || _fieldName in _fields ? fieldName : _fieldName;
      _fields[__fieldName] = field;
    }

    _types[getTypeName(typeName)] = { ...type, fields: _fields };
  }

  return _types;
};

function fixDirective(types: Types) {
  types = copyTypes(types);
  const array: [fieldName: string, field: Field][] = [];

  for (const [typeName, type] of Object.entries(types)) {
    for (const [fieldName, field] of Object.entries(type.fields)) {
      const directives: FieldDirectives = field.directives;

      if (field.scalar) {
        delete directives.field;
        delete directives.type;
      }

      const { field: fieldDirective, type: typeDirective } = directives;
      const fieldDirectiveName = fieldDirective?.name;

      if (fieldDirectiveName !== undefined) {
        fieldDirective!.name = getNonListFieldName(fieldDirectiveName);

        if (!field.list) {
          field.null = true;
        }
      }

      const typeDirectiveName = typeDirective?.name;

      if (typeDirectiveName !== undefined) {
        if (getTypeName(fieldName) === field.type) {
          const refTypeFields = types[field.type].fields;
          const refFieldName = getListFieldName(typeName);
          const refDirectives = refTypeFields[refFieldName]?.directives ?? {};
          delete directives.type;
          delete refDirectives.type;

          refTypeFields[refFieldName] = {
            directives: refDirectives,
            list: true,
            null: false,
            scalar: false,
            type: typeName,
          };

          continue;
        }

        array.push([fieldName, field]);
        const typeNames = typeDirectiveName.split("To").map(getTypeName);

        if (typeNames.length === 2 && typeNames.every((typeName) => typeName in types)) {
          typeDirective!.name = getJoinTypeName(typeNames);
          continue;
        }
      }
    }
  }

  array.forEach(([fieldName, field], i, array) => {
    const typeDirective = field.directives.type!;
    const joinTypeName = typeDirective.name;
    const _array = array.slice(i + 1).filter((v) => v[1].directives.type!.name === joinTypeName);

    if (_array.length === 1) {
      const [_fieldName, _field] = _array[0];
      typeDirective.name = _field.directives.type!.name = getJoinTypeName([fieldName, _fieldName]);
    }
  });

  return types;
}

export const model = (source: string) => {
  buildSchema(`${customScalars}${modelDirectives}${source}`);
  let types = getTypes(source);
  types = deleteBaseFields(types);
  types = fixName(types);
  types = fixDirective(types);
  let model = printTypes(types);
  return model;
};
