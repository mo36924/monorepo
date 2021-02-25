import { expect, it, describe } from "@jest/globals";
import fetch from "node-fetch";
import createServer from "./index";

describe("http-server", () => {
  it("listen", async () => {
    const server = await createServer({
      port: 8080,
      middlewares: [
        async (req, res) => {
          res.end("test");
        },
      ],
    });

    const res = await fetch("http://localhost:8080/");
    const text = await res.text();
    expect(text).toEqual("test");
    server.close();
  });
});
