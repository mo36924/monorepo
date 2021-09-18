import { escape, escapeId as _escapeId } from "@mo36924/mysql-escape";
import { parse } from "uuid";

const kv: { [key: string]: string } = Object.create(null);

export { escape };
export const escapeId = (value: string) => (kv[value] ??= _escapeId(value));
export const escapeUUID = (uuid: string) => escape(Buffer.from(parse(uuid) as Uint8Array));
export const escapedTrue = escape(true);
export const escapedFalse = escape(false);
export const escaped1 = escape(1);
export const escapedNull = escape(null);
export const escapedIdColumn = escapeId("id");
export const escapedVersionColumn = escapeId("version");
export const escapedCreatedAtColumn = escapeId("createdAt");
export const escapedUpdatedAtColumn = escapeId("updatedAt");
export const escapedIsDeletedColumn = escapeId("isDeleted");
export const baseColumns: string[] = ["id", "version", "createdAt", "updatedAt", "isDeleted"];
export const escapedBaseColumns: string[] = [
  escapedIdColumn,
  escapedVersionColumn,
  escapedCreatedAtColumn,
  escapedUpdatedAtColumn,
  escapedIsDeletedColumn,
];
export const escapedVersionColumnIncrement = `${escapedVersionColumn}+${escaped1}`;
