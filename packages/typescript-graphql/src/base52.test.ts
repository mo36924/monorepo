import { describe, expect, it } from "@jest/globals";
import { decode, encode } from "./base52";

describe("base52", () => {
  it("decode", () => {
    expect(decode("abc")).toMatchInlineSnapshot(`5460`);
  });

  it("encode", () => {
    expect(encode(5460)).toMatchInlineSnapshot(`"abc"`);
  });

  it("base52", () => {
    for (let i = 0; i < 100; i++) {
      expect(decode(encode(i))).toStrictEqual(i);
    }
  });
});
