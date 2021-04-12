import cosmiconfig from "./cosmiconfig";

const name: "postgres" = cosmiconfig.database?.type ?? "postgres";

const main: any = cosmiconfig.database?.main ?? {
  host: "127.0.0.1",
  database: "postgres",
  user: "postgres",
  password: "postgres",
};

const replica: any = cosmiconfig.database?.replica ?? main;

export default { name, main, replica };
