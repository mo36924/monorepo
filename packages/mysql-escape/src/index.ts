import mysql from "sqlstring";

export const escape = (value: string | number | boolean | Date | Buffer | null | undefined) =>
  mysql.escape(value, false, "Z");
export const escapeId = (value: string) => mysql.escapeId(value);
