import { describe, expect, it } from "@jest/globals";
import { raw } from "jest-snapshot-serializer-raw";
import { escape, escapeId } from "./index";

const _escape = (value: Parameters<typeof escape>[0]) => raw(escape(value));
const _escapeId = (value: Parameters<typeof escapeId>[0]) => raw(escapeId(value));

describe("mysql-escape", () => {
  it("escape", () => {
    expect(_escape(0)).toMatchInlineSnapshot(`0`);
    expect(_escape(true)).toMatchInlineSnapshot(`true`);
    expect(_escape(false)).toMatchInlineSnapshot(`false`);
    expect(_escape("test")).toMatchInlineSnapshot(`'test'`);
    expect(_escape(new Date(0))).toMatchInlineSnapshot(`'1970-01-01 00:00:00.000'`);
  });

  it("escapeId", () => {
    expect(_escapeId("test")).toMatchInlineSnapshot(`\`test\``);
  });
});
