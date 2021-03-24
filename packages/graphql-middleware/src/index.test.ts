import { stringify } from "querystring";
import { describe, expect, it } from "@jest/globals";
import { createServer } from "@mo36924/http-server";
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

    const server = createServer();

    server.use(
      index({
        schema,
        async execute(req, res, schema, document, variables, operationName) {
          return await execute(schema, document, { count: 1 }, {}, variables, operationName);
        },
      }),
    );

    await server.listen(10000);

    const res = await fetch(`http://localhost:10000/graphql?${stringify({ query: "{ count }" })}`);
    const json = await res.json();

    expect(json).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "count": 1,
        },
      }
    `);

    await server.close();
  });
});
