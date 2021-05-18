import { expect, test } from "@jest/globals";
import { format } from "jest-snapshot-serializer-prettier";
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
    import { write, read } from "fs";
    import { resolve, join } from "path";

    console.log(<div />);
  `);
});
