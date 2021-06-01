import { existsSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import type { Options as InjectOptions } from "@mo36924/babel-plugin-inject";
import type { Options as PageGeneratorOptions } from "@mo36924/page-generator";
import { createObject } from "@mo36924/utils";
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
  client?: string;
  clientUrl?: string;
  server?: string;
  clientExtensions?: string[];
  serverExtensions?: string[];
  prebuild?: (string | string[])[];
  replaceModule?: { [name: string]: string };
  inject?: InjectOptions["declarations"];
  css?: string;
  cssUrl?: string;
  icon?: string;
  iconUrl?: string;
  graphql?: string;
  page?: PageGeneratorOptions;
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
const extensions = [".tsx", ".jsx", ".ts", ".mjs", ".js", ".cjs", ".json"];
const resolve = (...paths: string[]) => path.resolve(rootDir, ...paths);
const pathname = (path: string) => pathToFileURL(path).pathname;
const result = cosmiconfigSync("app").search(rootDir);
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
export const client = config.client ? resolve(config.client) : resolve("index.client.ts");
export const clientUrl = pathname(client);
export const server = config.server ? resolve(config.server) : resolve("index.ts");
export const prebuild = config.prebuild ?? ["readable-stream", ["pg", "pg-pool"]];
export const replaceModule = createObject(config.replaceModule ?? { "pg-native": "module.exports = {};" });
export const inject: Config["inject"] = createObject(
  {
    Body: ["@mo36924/components", "Body"],
    Head: ["@mo36924/components", "Head"],
    Html: ["@mo36924/components", "Html"],
    Link: ["@mo36924/components", "Link"],
    Script: ["@mo36924/components", "Script"],
    Style: ["@mo36924/components", "Style"],
    Title: ["@mo36924/components", "Title"],
    Dialog: ["@headlessui/react", "Dialog"],
    Disclosure: ["@headlessui/react", "Disclosure"],
    FocusTrap: ["@headlessui/react", "FocusTrap"],
    Listbox: ["@headlessui/react", "Listbox"],
    Menu: ["@headlessui/react", "Menu"],
    Popover: ["@headlessui/react", "Popover"],
    Portal: ["@headlessui/react", "Portal"],
    RadioGroup: ["@headlessui/react", "RadioGroup"],
    Switch: ["@headlessui/react", "Switch"],
    Transition: ["@headlessui/react", "Transition"],
    useQuery: ["@mo36924/graphql-preact", "useQuery"],
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
  },
  config.inject,
);
export const css = config.css ? resolve(config.css) : resolve("index.css");
export const cssUrl = existsSync(css) ? pathname(css) : "";
export const icon = config.icon ? resolve(config.icon) : resolve("index.ico");
export const iconUrl = existsSync(icon) ? pathname(icon) : "";
export const graphql = config.graphql ? resolve(config.graphql) : resolve("index.gql");
export const page: Config["page"] = {
  watch,
  dir: resolve(config.page?.dir ?? "pages"),
  file: resolve(config.page?.file ?? "pages.ts"),
  template: resolve(config.page?.template ?? "pages.template.ts"),
  include: config.page?.include ?? ["**/*.tsx"],
  exclude: config.page?.exclude ?? ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};
const configDatabase = config.database ?? { name: "postgres" };
const configDatabaseDevelopment = config.databaseDevelopment ?? { name: "postgres" };
const reset = configDatabaseDevelopment.reset ?? true;
let database: Config["database"];
let databaseDevelopment: Config["databaseDevelopment"];

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
  database = { name, main, replica };
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
  database = { name, main, replica };
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
  databaseDevelopment = { name, main, replica, reset };
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
  databaseDevelopment = { name, main, replica, reset };
}

export { database, databaseDevelopment };
