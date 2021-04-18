import { describe, expect, it } from "@jest/globals";
import index from "./index";

describe("typescript-patch", () => {
  it("patch", async () => {
    await expect(index()).resolves.toBeUndefined();
  });
});
