const replacer = (_key: string, value: any) => {
  if (value instanceof Date) {
    return [0, value.toJSON()];
  }

  return value;
};

const reviver = (_key: string, value: any) => {
  if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "string") {
    switch (value[0]) {
      case 0:
        return new Date(value[1]);
    }
  }

  return value;
};

export const stringify = (data: any) => JSON.stringify(data, replacer);

export const parse = (data: string) => JSON.parse(data, reviver);
