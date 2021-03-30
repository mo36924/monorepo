import { describe, expect, it } from "@jest/globals";
import fetch from "node-fetch";
import { createServer } from "./index";

describe("http-server", () => {
  it("listen", async () => {
    const port = 18080;
    const server = createServer();

    server.use(() => (req, res) => {
      res.end("test");
      return true;
    });

    await server.listen(port);
    const res = await fetch(`http://localhost:${port}/`);
    const text = await res.text();
    expect(text).toEqual("test");
    await server.close();
  });
});
