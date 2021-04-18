let baseName = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const baseNameLength = 52;

export const base = (base: string) => {
  if (baseNameLength !== base.length) {
    throw new Error("Invalid Argument Value");
  }

  baseName = base;
};

export const encode = (value: number) => {
  let result = "";

  do {
    result += baseName[value % baseNameLength];
    value = Math.floor(value / baseNameLength);
  } while (value > 0);

  return result;
};

export const decode = (value: string) => {
  let result = 0;

  for (let i = 0, len = value.length; i < len; i++) {
    result += baseNameLength ** i * baseName.indexOf(value[i]);
  }

  return result;
};
