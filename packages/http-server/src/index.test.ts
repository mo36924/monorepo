import { expect, it, describe } from "@jest/globals";
import fetch from "node-fetch";
import createServer from "./index";

describe("http-server", () => {
  it("listen", async () => {
    const port = 18080;

    const server = await createServer({
      port,
      middlewares: [
        async (req, res) => {
          res.end("test");
        },
      ],
    });

    const res = await fetch(`http://localhost:${port}/`);
    const text = await res.text();
    expect(text).toEqual("test");
    server.close();
  });
});
