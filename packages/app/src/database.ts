import { exec } from "child_process";
import { promisify } from "util";
import type { Config } from "@mo36924/config";
import { mysql, postgres } from "@mo36924/graphql-schema";
import sleep from "@mo36924/sleep";

const execAsync = promisify(exec);

const retry = async <T>(fn: () => T | Promise<T>): Promise<T> => {
  for (let i = 0; i < 10; i++) {
    try {
      const result = await fn();
      return result;
    } catch {
      sleep(1000);
    }
  }

  throw new Error("Error establishing a database connection");
};

export default async (config: Config) => {
  const database = config.databaseDevelopment;

  if (!config.watch || !database.reset) {
    return async () => {};
  }

  if (database.name === "mysql") {
    const { main } = database;
    const { database: _database, user, password, port } = main;
    await execAsync(`docker rm -f ${_database}`);

    await execAsync(
      `docker run --name ${_database} -e MYSQL_ROOT_PASSWORD=${password} -e MYSQL_DATABASE=${_database} -e MYSQL_USER=${user} -e MYSQL_PASSWORD=${password} -p ${port}:${port} -d mysql`,
    );

    return async (schema: string) => {
      const { createConnection } = await import("mysql2/promise");
      const { escapeId } = await import("@mo36924/mysql-escape");
      const escapedDatabase = escapeId(_database);

      const client = await retry(() =>
        createConnection({
          ...main,
          multipleStatements: true,
        }),
      );

      await client.connect();
      await client.query(`drop database if exists ${escapedDatabase};`);
      await client.query(`create database ${escapedDatabase};`);
      await client.query(`use ${escapedDatabase};`);
      await client.query(mysql.schema(schema));
      await client.query(mysql.data(schema));
      await client.end();

      // const [rows] = await client.query(
      //   "select table_name as `table_name` from information_schema.tables where table_schema=database() and table_type='BASE TABLE';",
      // );

      // if (Array.isArray(rows)) {
      //   await client.query("set foreign_key_checks=0;");
      //   await client.query(`drop table if exists ${rows.map(({ table_name }: any) => escapeId(table_name)).join()};`);
      //   await client.query("set foreign_key_checks=1;");
      // }

      // await client.query(mysql.schema(schema));
      // await client.query(mysql.data(schema));
      // await client.end();
    };
  } else {
    const { main } = database;
    const { database: _database, password, user, port } = main;
    await execAsync(`docker rm -f ${_database}`);

    await execAsync(
      `docker run --name ${_database} -e POSTGRES_PASSWORD=${password} -e POSTGRES_USER=${user} -e POSTGRES_DB=${_database} -p ${port}:${port} -d postgres`,
    );

    return async (schema: string) => {
      const {
        default: { Client },
      } = await import("pg");

      const { escapeId } = await import("@mo36924/postgres-escape");
      const escapedDatabase = escapeId(_database);

      let client = await retry(
        () =>
          new Client({
            ...main,
            database: "postgres",
          }),
      );

      await client.connect();
      await client.query(`drop database if exists ${escapedDatabase} with (force);`);
      await client.query(`create database ${escapedDatabase};`);
      await client.end();
      client = new Client({ ...database.main });
      await client.connect();
      await client.query(postgres.schema(schema));
      await client.query(postgres.data(schema));
      await client.end();
    };
  }
};
