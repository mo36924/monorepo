const baseName = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const baseNameLength = baseName.length;

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
