import { resolve } from "path";
import ts from "typescript";

const path = resolve("node_modules/.cache/dev-server.json");
const obj = (): { [path: string]: string | undefined } => Object.create(null);

const cache = {
  graphql: obj(),
  client: obj(),
  server: obj(),
  json: obj(),
  typescript: obj(),
  raw: {
    tsBuildInfo: undefined as string | undefined,
  },
};

try {
  const data = ts.sys.readFile(path);

  if (data) {
    const _cache = JSON.parse(data);

    for (const [key, value] of Object.entries(cache)) {
      Object.assign(value, _cache[key]);
    }
  }
} catch {
  ts.sys.deleteFile?.(path);
}

process.on("exit", () => {
  try {
    ts.sys.writeFile(path, JSON.stringify(cache));
  } catch {}
});

export default cache;
