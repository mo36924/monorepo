import mysql from "sqlstring";

export const escape: (value: string | number | boolean | Date | null | undefined) => string = (value) =>
  mysql.escape(value, false, "Z");
export const escapeId: (value: string) => string = mysql.escapeId;
