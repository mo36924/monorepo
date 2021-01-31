import { describe, expect, it } from "@jest/globals";
import { jsx } from "preact/jsx-runtime";
import { serialize, test } from "./index";

describe("jest-snapshot-serializer-preact", () => {
  const vnode = jsx("div", { children: jsx("div", {}) });

  it("test", () => {
    expect(test(vnode)).toBeTruthy();
  });

  it("format", () => {
    expect(serialize(vnode)).toMatchInlineSnapshot(`
      "<div>
        <div></div>
      </div>"
    `);
  });
});
