import type { Types } from "./types";

export const sortTypes = (types: Types) => {
  const typeNames = getSortedTypeNames(types);
  const _types: Types = Object.create(null);

  for (const typeName of typeNames) {
    _types[typeName] = types[typeName];
  }

  return _types;
};

export const getSortedTypeNames = (types: Types) => {
  const sortKeys: { [typeName: string]: number } = Object.create(null);

  const getSortKey = (dep: string, deps: string[] = []): number => {
    if (sortKeys[dep] !== undefined) {
      return sortKeys[dep];
    }

    const type = types[dep];
    const fields = type.fields;
    let sortKey = 0;

    if (type.directives.join) {
      sortKey = 99;
    } else if (deps.includes(dep)) {
      sortKey = 98;
    } else {
      sortKey = Math.max(
        0,
        ...Object.values(fields).map(({ directives: { ref } }) => (ref ? getSortKey(ref.name, [dep, ...deps]) + 1 : 0)),
      );
    }

    sortKeys[dep] = sortKey;
    return sortKey;
  };

  const typeNames = Object.keys(types).sort((a, b) => {
    const sortKeyA = getSortKey(a);
    const sortKeyB = getSortKey(b);

    if (sortKeyA < sortKeyB) {
      return -1;
    }

    if (sortKeyA > sortKeyB) {
      return 1;
    }

    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  });

  return typeNames;
};
