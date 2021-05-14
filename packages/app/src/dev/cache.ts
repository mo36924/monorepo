import { readFile } from "fs/promises";
import { resolve } from "path";
import ts from "typescript";
import watcher from "./watcher";

type CacheObject = { [url: string]: string };

export type Cache = {
  css: {
    style: CacheObject;
  };
  graphql: {
    script: CacheObject;
  };
  javascript: {
    client: CacheObject;
    server: CacheObject;
  };
  json: {
    script: CacheObject;
  };
  typescript: CacheObject;
};

const cacheObject = (): CacheObject => Object.create(null);

export default async (): Promise<Cache> => {
  const cachePath = resolve("node_modules/.cache/app.json");

  const cache: Cache = {
    css: {
      style: cacheObject(),
    },
    graphql: {
      script: cacheObject(),
    },
    javascript: {
      client: cacheObject(),
      server: cacheObject(),
    },
    json: {
      script: cacheObject(),
    },
    typescript: cacheObject(),
  };

  try {
    const data = await readFile(cachePath, "utf8");

    const _cache = JSON.parse(data, (key, value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        return Object.assign(cacheObject(), value);
      }

      if (typeof value === "string") {
        watcher.add(key);
      }

      return value;
    });

    Object.assign(cache, _cache);
  } catch {}

  cache.typescript = new Proxy(cache.typescript, {
    set(obj, prop, value) {
      if (typeof prop !== "string") {
        return true;
      }

      delete cache.javascript.server[prop];
      delete cache.javascript.client[prop];
      obj[prop] = value;
      return true;
    },
  });

  for (const prop of ["css", "graphql", "javascript", "json"] as const) {
    for (const [key, value] of Object.entries(cache[prop])) {
      (cache[prop] as any)[key] = new Proxy(value, {
        set(obj, prop: string, value: string) {
          watcher.add(prop);
          obj[prop] = value;
          return true;
        },
      });
    }
  }

  watcher.onchange((absolutePath) => {
    delete cache.css.style[absolutePath];
    delete cache.graphql.script[absolutePath];
    delete cache.javascript.client[absolutePath];
    delete cache.javascript.server[absolutePath];
    delete cache.json.script[absolutePath];
  });

  process.on("exit", () => {
    try {
      ts.sys.writeFile(cachePath, JSON.stringify(cache, null, 2));
    } catch {}
  });

  return cache;
};
