import { FormatOptions, format } from "sql-formatter";

const SQL = Symbol.for("jest-snapshot-serializer-sql");

export type Wrapper = { [SQL]: string };
export const test = (value: any): value is Wrapper => value && typeof value[SQL] === "string";
export const serialize = (value: Wrapper): string => value[SQL];
export const sql = (value: string, options?: FormatOptions): Wrapper => ({ [SQL]: format(value, options) });
export const mysql = (value: string, options?: FormatOptions): Wrapper => ({
  [SQL]: format(value, { ...options, language: "mysql" }),
});
export const postgresql = (value: string, options?: FormatOptions): Wrapper => ({
  [SQL]: format(value, { ...options, language: "postgresql" }),
});
