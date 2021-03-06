import { describe, expect, it } from "@jest/globals";
import { raw, serialize, test } from "./index";

describe("jest-snapshot-serializer-raw", () => {
  it("test", () => {
    expect(test(raw("test"))).toBeTruthy();
  });

  it("serialize", () => {
    const value = "serialize";
    expect(serialize(raw(value))).toEqual(value);
  });
});
