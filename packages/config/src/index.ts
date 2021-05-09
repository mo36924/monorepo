import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Options as InjectOptions } from "@mo36924/babel-plugin-inject";
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
  mode?: "development" | "production";
  port?: number;
  devServerPort?: number;
  clientExtensions?: string[];
  serverExtensions?: string[];
  clientInject?: InjectOptions["declarations"];
  serverInject?: InjectOptions["declarations"];
  main?: string;
  dirname?: string;
  basename?: string;
  graphql?: string;
  page?: {
    watch?: boolean;
    dir?: string;
    file?: string;
    include?: string[];
    exclude?: string[];
  };
  database?: DatabaseConfig;
  databaseDevelopment?: DatabaseDevelopmentConfig;
};

type DeepRequired<T> = Required<
  {
    [K in keyof T]: Required<T>[K] extends {} ? Required<T[K]> : T[K];
  }
>;

export type Config = DeepRequired<PartialConfig>;
const filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(filename, "..", "..", "..", "..", "..");
const moduleName = "app";
const extensions = [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs", ".json"];
const resolve = (...paths: string[]) => path.resolve(rootDir, ...paths);

const createObject = (...sources: InjectOptions["declarations"][]): Required<InjectOptions>["declarations"] =>
  Object.assign(Object.fromEntries(Object.entries(Object.assign({}, ...sources)).filter((entry) => entry[1])));

const basenames: string[] = [];

try {
  basenames.push(...readdirSync(resolve(moduleName)));
} catch {}

const result = cosmiconfigSync(moduleName).search(rootDir);
const config: PartialConfig = result?.config ?? {};

export const watch = (process.env.NODE_ENV ?? config.mode) !== "production";
export const mode = watch ? "development" : "production";
export const port = parseInt(process.env.PORT!, 10) || config.port || 3000;
export const devServerPort = parseInt(process.env.DEV_SERVER_PORT!, 10) || config.devServerPort || port + 1;
export const clientExtensions = config.clientExtensions ?? [
  ...extensions.map((extension) => `.client${extension}`),
  ...extensions,
];
export const serverExtensions = config.serverExtensions ?? [
  ...extensions.map((extension) => `.server${extension}`),
  ...extensions,
];

const inject: InjectOptions["declarations"] = {
  Body: ["@mo36924/components", "Body"],
  Head: ["@mo36924/components", "Head"],
  Html: ["@mo36924/components", "Html"],
  Title: ["@mo36924/components", "Title"],
  useQuery: ["@mo36924/graphql-react", "useQuery"],
  hydrate: ["@mo36924/hydrate", "default"],
  pageMatch: ["@mo36924/page-match", "default"],
  pages: ["@mo36924/pages", "default"],
  Children: ["react", "Children"],
  Component: ["react", "Component"],
  Fragment: ["react", "Fragment"],
  PureComponent: ["react", "PureComponent"],
  StrictMode: ["react", "StrictMode"],
  Suspense: ["react", "Suspense"],
  cloneElement: ["react", "cloneElement"],
  createContext: ["react", "createContext"],
  createElement: ["react", "createElement"],
  createFactory: ["react", "createFactory"],
  createRef: ["react", "createRef"],
  forwardRef: ["react", "forwardRef"],
  isValidElement: ["react", "isValidElement"],
  lazy: ["react", "lazy"],
  memo: ["react", "memo"],
  useCallback: ["react", "useCallback"],
  useContext: ["react", "useContext"],
  useDebugValue: ["react", "useDebugValue"],
  useEffect: ["react", "useEffect"],
  useImperativeHandle: ["react", "useImperativeHandle"],
  useLayoutEffect: ["react", "useLayoutEffect"],
  useMemo: ["react", "useMemo"],
  useReducer: ["react", "useReducer"],
  useRef: ["react", "useRef"],
  useState: ["react", "useState"],
  createPortal: ["react-dom", "createPortal"],
  findDOMNode: ["react-dom", "findDOMNode"],
  render: ["react-dom", "render"],
  unmountComponentAtNode: ["react-dom", "unmountComponentAtNode"],
  renderToStaticMarkup: ["react-dom/server", "renderToStaticMarkup"],
  renderToString: ["react-dom/server", "renderToString"],
};

export const clientInject = createObject(inject, config.clientInject);
export const serverInject = createObject(inject, config.serverInject);
export const main = config.main
  ? resolve(config.main)
  : resolve(
      moduleName,
      serverExtensions.filter((extname) => `index${extname}`).find((basename) => basenames.includes(basename)) ??
        "index.ts",
    );
export const dirname = path.dirname(main);
export const basename = path.basename(main);
export const graphql = resolve(config.graphql ?? "./graphql/index.gql");
export const page: Config["page"] = {
  watch,
  dir: resolve(config.page?.dir ?? "pages"),
  file: resolve(config.page?.file ?? `${moduleName}/pages.ts`),
  include: config.page?.include ?? ["**/*.tsx"],
  exclude: config.page?.exclude ?? ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};

const configDatabase = config.database ?? { name: "postgres" };
const configDatabaseDevelopment = config.databaseDevelopment ?? { name: "postgres" };
const reset = configDatabaseDevelopment.reset ?? true;

let _database: Config["database"];
let _databaseDevelopment: Config["databaseDevelopment"];

if (configDatabase.name === "mysql") {
  const name = configDatabase.name;

  const main = configDatabase.main ?? {
    host: "127.0.0.1",
    port: 3306,
    user: "production",
    password: "production",
    database: "production",
  };

  const replica = configDatabase.replica ?? [main];
  _database = { name, main, replica };
} else {
  const name = configDatabase.name;

  const main = configDatabase.main ?? {
    host: "127.0.0.1",
    port: 5432,
    user: "production",
    password: "production",
    database: "production",
  };

  const replica = configDatabase.replica ?? [main];
  _database = { name, main, replica };
}

if (configDatabaseDevelopment.name === "mysql") {
  const name = configDatabaseDevelopment.name;

  const main = configDatabaseDevelopment.main ?? {
    host: "127.0.0.1",
    port: 3306,
    user: "development",
    password: "development",
    database: "development",
  };

  const replica = configDatabaseDevelopment.replica ?? [main];
  _databaseDevelopment = { name, main, replica, reset };
} else {
  const name = configDatabaseDevelopment.name;

  const main = configDatabaseDevelopment.main ?? {
    host: "127.0.0.1",
    port: 5432,
    user: "development",
    password: "development",
    database: "development",
  };

  const replica = configDatabaseDevelopment.replica ?? [main];
  _databaseDevelopment = { name, main, replica, reset };
}

export const database = _database;
export const databaseDevelopment = _databaseDevelopment;

export default {
  watch,
  mode,
  port,
  devServerPort,
  clientExtensions,
  serverExtensions,
  clientInject,
  serverInject,
  main,
  dirname,
  basename,
  graphql,
  page,
  database,
  databaseDevelopment,
} as Config;
