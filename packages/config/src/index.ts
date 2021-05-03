import { readdirSync, readFileSync } from "fs";
import { basename as _basename, dirname as _dirname, resolve as _resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { cosmiconfigSync } from "cosmiconfig";

type DatabaseConfig =
  | {
      name: "mysql";
      main?: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        [key: string]: any;
      };
      replica?: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        [key: string]: any;
      }[];
    }
  | {
      name: "postgres";
      main?: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        [key: string]: any;
      };
      replica?: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
        [key: string]: any;
      }[];
    };

type DatabaseDevelopmentConfig = DatabaseConfig & { reset?: boolean };

export type PartialConfig = {
  watch?: boolean;
  client?: string;
  server?: string;
  main?: string;
  dirname?: string;
  basename?: string;
  favicon?: string;
  css?: string;
  module?: string;
  nomodule?: string;
  graphql?: string;
  page?: {
    dir?: string;
    file?: string;
    include?: string[];
    exclude?: string[];
  };
  database?: DatabaseConfig;
  databaseDevelopment?: DatabaseDevelopmentConfig;
  extensions?: {
    client?: string[];
    server?: string[];
  };
  inject?: {
    [name: string]: [source: string] | [source: string, name?: string] | null;
  };
  filepath?: string | null;
  rootDir?: string;
};

type DeepRequired<T> = Required<
  {
    [K in keyof T]: Required<T>[K] extends {} ? Required<T[K]> : T[K];
  }
>;

export type Config = DeepRequired<PartialConfig>;

const _filename = fileURLToPath(import.meta.url);
const _rootDir = _resolve(_filename, "..", "..", "..", "..", "..");
const rootBasenames = readdirSync(_rootDir);
const result = cosmiconfigSync("app", { stopDir: _rootDir }).search(_rootDir);

const cosmiconfig = {
  ...(result?.config as PartialConfig),
  filepath: result?.filepath ?? null,
  rootDir: _rootDir,
};

const _extensions = [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs", ".json"];
const pkg: { [key: string]: any } = {};
const resolve = (path: string) => _resolve(_rootDir, path);
const normalize = (path: string) => pathToFileURL(resolve(path)).pathname;

try {
  Object.assign(pkg, JSON.parse(readFileSync(resolve("package.json"), "utf8")));
} catch {}

const extensionsClient =
  cosmiconfig.extensions && Array.isArray(cosmiconfig.extensions.client)
    ? cosmiconfig.extensions.client
    : [..._extensions.map((extension) => `.client${extension}`), ..._extensions];

const extensionsServer =
  cosmiconfig.extensions && Array.isArray(cosmiconfig.extensions.server)
    ? cosmiconfig.extensions.server
    : [..._extensions.map((extension) => `.server${extension}`), ..._extensions, ".node"];

const cosmiconfigDatabase = cosmiconfig.database ?? { name: "postgres" };
const cosmiconfigDatabaseDevelopment = cosmiconfig.databaseDevelopment ?? { name: "postgres" };
const reset = cosmiconfigDatabaseDevelopment.reset ?? true;
let configDatabase: Config["database"];
let configDatabaseDevelopment: Config["databaseDevelopment"];

if (cosmiconfigDatabase.name === "mysql") {
  const name = cosmiconfigDatabase.name;

  const main = cosmiconfigDatabase.main ?? {
    host: "127.0.0.1",
    port: 3306,
    user: "production",
    password: "production",
    database: "production",
  };

  const replica = cosmiconfigDatabase.replica ?? [main];
  configDatabase = { name, main, replica };
} else {
  const name = cosmiconfigDatabase.name;

  const main = cosmiconfigDatabase.main ?? {
    host: "127.0.0.1",
    port: 5432,
    user: "production",
    password: "production",
    database: "production",
  };

  const replica = cosmiconfigDatabase.replica ?? [main];
  configDatabase = { name, main, replica };
}

if (cosmiconfigDatabaseDevelopment.name === "mysql") {
  const name = cosmiconfigDatabaseDevelopment.name;

  const main = cosmiconfigDatabaseDevelopment.main ?? {
    host: "127.0.0.1",
    port: 3306,
    user: "development",
    password: "development",
    database: "development",
  };

  const replica = cosmiconfigDatabaseDevelopment.replica ?? [main];
  configDatabaseDevelopment = { name, main, replica, reset };
} else {
  const name = cosmiconfigDatabaseDevelopment.name;

  const main = cosmiconfigDatabaseDevelopment.main ?? {
    host: "127.0.0.1",
    port: 5432,
    user: "development",
    password: "development",
    database: "development",
  };

  const replica = cosmiconfigDatabaseDevelopment.replica ?? [main];
  configDatabaseDevelopment = { name, main, replica, reset };
}

const _watch = cosmiconfig?.watch ?? process.env.NODE_ENV !== "production";

const _client =
  cosmiconfig.client ??
  extensionsClient.filter((extname) => `index${extname}`).find((basename) => rootBasenames.includes(basename)) ??
  "index.client.ts";

const _server =
  cosmiconfig.client ??
  extensionsServer.filter((extname) => `index${extname}`).find((basename) => rootBasenames.includes(basename)) ??
  "index.ts";

const _main = resolve(pkg.main ?? "dist/index.js");

const config: Config = {
  watch: _watch,
  client: resolve(_client),
  server: resolve(_server),
  main: resolve(_main),
  dirname: _dirname(_main),
  basename: _basename(_main),
  favicon: normalize(cosmiconfig.favicon ?? "favicon.ico"),
  css: normalize(cosmiconfig.css ?? "index.css"),
  module: normalize(cosmiconfig.module ?? _client),
  nomodule: normalize(cosmiconfig.nomodule ?? _client),
  graphql: resolve(cosmiconfig.graphql ?? "index.gql"),
  page: {
    dir: resolve(cosmiconfig.page?.dir ?? "pages"),
    file: resolve(cosmiconfig.page?.file ?? "lib/pages.ts"),
    include: cosmiconfig.page?.include ?? ["**/*.tsx"],
    exclude: cosmiconfig.page?.exclude ?? ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
  },
  database: configDatabase,
  databaseDevelopment: configDatabaseDevelopment,
  extensions: {
    client: extensionsClient,
    server: extensionsServer,
  },
  inject: {
    ...cosmiconfig.inject,
  },
  filepath: cosmiconfig.filepath,
  rootDir: cosmiconfig.rootDir,
};

export const {
  watch,
  client,
  server,
  main,
  dirname,
  basename,
  favicon,
  css,
  module,
  nomodule,
  graphql,
  page,
  database,
  databaseDevelopment,
  extensions,
  inject,
  filepath,
  rootDir,
} = config;
