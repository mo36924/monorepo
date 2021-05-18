import type { Config } from "@mo36924/config";
import { mysql, postgres } from "@mo36924/graphql-schema";
import exec from "@mo36924/promise-exec";
import retry from "@mo36924/retry";

export default async (config: Config) => {
  const database = config.databaseDevelopment;

  if (!config.watch || !database.reset) {
    return async () => {};
  }

  if (database.name === "mysql") {
    const { main } = database;
    const { database: _database, user, password, port } = main;
    await exec(`docker rm -fv ${_database}`);

    await exec(
      `docker run --name ${_database} -e MYSQL_ROOT_PASSWORD=${password} -e MYSQL_DATABASE=${_database} -e MYSQL_USER=${user} -e MYSQL_PASSWORD=${password} -p ${port}:3306 -d mysql`,
    );

    return async (schema: string) => {
      const { createConnection } = await import("mysql2/promise");
      const { escapeId } = await import("@mo36924/mysql-escape");
      const escapedDatabase = escapeId(_database);

      const client = await retry(async () => {
        const client = await createConnection({
          ...main,
          multipleStatements: true,
        });

        await client.connect();
        return client;
      });

      await client.query(`drop database if exists ${escapedDatabase};`);
      await client.query(`create database ${escapedDatabase};`);
      await client.query(`use ${escapedDatabase};`);
      await client.query(mysql.schema(schema));
      await client.query(mysql.data(schema));
      await client.end();
    };
  } else {
    const { main } = database;
    const { database: _database, password, user, port } = main;
    await exec(`docker rm -fv ${_database}`);

    await exec(
      `docker run --name ${_database} -e POSTGRES_PASSWORD=${password} -e POSTGRES_USER=${user} -e POSTGRES_DB=${_database} -p ${port}:5432 -d postgres`,
    );

    return async (schema: string) => {
      const {
        default: { Client },
      } = await import("pg");

      const { escapeId } = await import("@mo36924/postgres-escape");
      const escapedDatabase = escapeId(_database);

      let client = await retry(async () => {
        const client = new Client({
          ...main,
          database: "postgres",
        });

        await client.connect();
        return client;
      });

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
