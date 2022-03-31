import { stringify } from "querystring";
import { describe, expect, it } from "@jest/globals";
import { createServer } from "@mo36924/http-server";
import { execute, parse } from "graphql";
import fetch from "node-fetch";
import index from "./index";

describe("http-server", () => {
  it("listen", async () => {
    const ast = parse(`
      type Query {
        count: Int
      }
    `);

    const server = createServer();

    server.use(
      index({
        ast,
        async execute(req, res, schema, document, variables, operationName) {
          return await execute({
            schema,
            document,
            rootValue: { count: 1 },
            contextValue: {},
            variableValues: variables,
            operationName,
          });
        },
      }),
    );

    await server.listen(10002);
    const res = await fetch(`http://localhost:10002/graphql?${stringify({ query: "{ count }" })}`);
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
