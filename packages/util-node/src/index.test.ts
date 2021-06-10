import { describe, test, expect } from "@jest/globals";
import { emptyPort } from "./index";

describe("util-node", () => {
  test("emptyPort", async () => {
    expect(await emptyPort(10000)).toEqual(10000);
    expect(await emptyPort()).toBeGreaterThan(0);
  });
});
