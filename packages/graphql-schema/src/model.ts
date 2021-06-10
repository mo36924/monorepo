import { createObjectNull } from "@mo36924/util";
import type { Source } from "graphql";
import type { FieldDirectives } from "./directives";
import { buildTypes, Field, Fields, printTypes, sortTypes, Types } from "./types";
import {
  getFieldName,
  getJoinTypeName,
  getListFieldName,
  getTypeName,
  isReservedFieldName,
  isReservedTypeName,
} from "./util";

const fixModelTypes = (types: Types) => {
  const _types = createObjectNull<Types>();
  const joinTypeSet = new Set<string>();
  const renameJoinTypeFields: Field[] = [];

  for (const type of Object.values(types)) {
    const { name, fields } = type;
    const typeName = getTypeName(name);

    if (isReservedTypeName(typeName)) {
      continue;
    }

    const _fields = createObjectNull<Fields>();

    for (const field of Object.values(fields)) {
      const list = field.list;
      const name = (list ? getListFieldName : getFieldName)(field.name);

      if (isReservedFieldName(name)) {
        continue;
      }

      const { scalar, directives } = field;
      const type = getTypeName(field.type);
      const _directives: FieldDirectives = {};
      _fields[name] = { ...field, name, type, directives: _directives };

      if (scalar) {
        continue;
      }

      const _field = _fields[name];

      if (directives.field?.name) {
        if (!list) {
          _field.nullable = true;
        }

        _directives.field = { name: getFieldName(directives.field.name) } as FieldDirectives["field"];
      } else if (directives.type?.name && list) {
        let joinTypeName: string;

        if (getTypeName(name) === type) {
          joinTypeName = getJoinTypeName(typeName, type);
        } else {
          joinTypeName = getJoinTypeName(directives.type.name);
          renameJoinTypeFields.push(_field);
        }

        joinTypeSet.add(joinTypeName);
        _directives.type = { name: joinTypeName } as FieldDirectives["type"];
      }
    }

    _types[typeName] = {
      ...type,
      directives: {},
      fields: _fields,
    };
  }

  for (let i = 0, len = renameJoinTypeFields.length; i < len; i++) {
    const _renameJoinTypeFields = [renameJoinTypeFields[i]];

    for (let j = i + 1; j < len; j++) {
      if (renameJoinTypeFields[i].directives.type!.name === renameJoinTypeFields[j].directives.type!.name) {
        _renameJoinTypeFields.push(renameJoinTypeFields[j]);
      }
    }

    if (_renameJoinTypeFields.length === 2) {
      const joinTypeName = getJoinTypeName(_renameJoinTypeFields[0].name, _renameJoinTypeFields[1].name);
      joinTypeSet.add(joinTypeName);
      _renameJoinTypeFields[0].directives.type!.name = _renameJoinTypeFields[1].directives.type!.name = joinTypeName;
    }
  }

  for (const type of Object.keys(_types)) {
    const joinTypeName = getJoinTypeName(type);

    if (joinTypeSet.has(joinTypeName)) {
      delete _types[type];
    }
  }

  return _types;
};

export const fixModel = (graphql: string | Source) => {
  let types = buildModel(graphql);
  types = sortTypes(types);
  graphql = printTypes(types);
  return graphql;
};

export const buildModel = (graphql: string | Source) => {
  let types = buildTypes(graphql);
  types = fixModelTypes(types);
  return types;
};
