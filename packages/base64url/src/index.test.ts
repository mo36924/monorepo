import { describe, expect, test } from "@jest/globals";
import base64url from "./index";

describe("base64url", () => {
  test("Convert base64url", () => {
    const base64 = "kutf/uauL+w61xx3dTFXjw==";
    const _base64url = base64url(base64);
    expect(_base64url).toMatchInlineSnapshot(`"kutf_uauL-w61xx3dTFXjw"`);
  });
});
