import { expect, test } from "@jest/globals";
import { format } from "@mo36924/jest-snapshot-serializer-prettier";
import index from "./index";

test("eslint-lint-text", async () => {
  const code = await index(
    `
    import { resolve, join } from "path";
    import { write, read } from "fs";
    console.log(<div />)
  `,
    "index.tsx",
  );

  expect(format(code, { filepath: "index.tsx" })).toMatchInlineSnapshot(`
    import { read, write } from "fs";
    import { join, resolve } from "path";

    console.log(<div />);
  `);
});
