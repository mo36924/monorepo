import { createServer } from "http";
import { stringify } from "querystring";
import { describe, expect, it } from "@jest/globals";
import { buildSchema, execute } from "graphql";
import fetch from "node-fetch";
import index from "./index";

describe("http-server", () => {
  it("listen", async () => {
    const schema = buildSchema(`
      type Query {
        count: Int
      }
    `);

    const middleware = await index({
      schema,
      async execute(req, res, schema, document, variables, operationName) {
        return await execute(schema, document, { count: 1 }, {}, variables, operationName);
      },
    });

    const server = createServer(async (req, res) => {
      try {
        await middleware(req, res);
      } catch {}
    });

    server.listen(10000);

    const res = await fetch(`http://localhost:10000/graphql?${stringify({ query: "{ count }" })}`);
    const json = await res.json();

    expect(json).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "count": 1,
        },
      }
    `);

    server.close();
  });
});
