import { expect, test } from "@jest/globals";
import { format } from "jest-snapshot-serializer-prettier";
import index from "./index";

test("organize-imports", async () => {
  const data = index(`
    import { join } from "path";
    import { resolve } from "path";
    console.log(join, resolve);
  `);

  expect(format(data)).toMatchInlineSnapshot(`
    import { join, resolve } from "path";
    console.log(join, resolve);

  `);
});
