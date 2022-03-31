import { describe, expect, test } from "@jest/globals";
import { emptyPort } from "./index";

describe("util-node", () => {
  test("emptyPort", async () => {
    expect(await emptyPort(10001)).toEqual(10001);
    expect(await emptyPort()).toBeGreaterThan(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
});
