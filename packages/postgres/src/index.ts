import pg from "pg";

export type Result<T extends { [column: string]: any } = any> = {
  rows: T[];
  rowCount: number;
};

export type SQL = {
  <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<Result<T>>;
  <T = any>(query: string, values: any[]): Promise<Result<T>>;
};

let i = 0;
const hosts = process.env.PGHOSTS;
const Pool = pg.Pool;
const primaryPool = new Pool();
const replicaPools: pg.Pool[] = hosts ? hosts.split(",").map((host) => new Pool({ host })) : [primaryPool];

export const primary: SQL = <T = any>(strings: TemplateStringsArray | string, ...values: any[]): Promise<Result<T>> =>
  typeof strings === "string"
    ? primaryPool.query(strings, values[0])
    : primaryPool.query(
        strings.reduce((previousValue, currentValue, i) => previousValue + "$" + i + currentValue),
        values,
      );

export const replica: SQL = <T = any>(strings: TemplateStringsArray | string, ...values: any[]): Promise<Result<T>> => {
  const replica = replicaPools[(i = (i + 1) % replicaPools.length)];

  return typeof strings === "string"
    ? replica.query(strings, values[0])
    : replica.query(
        strings.reduce((previousValue, currentValue, i) => previousValue + "$" + i + currentValue),
        values,
      );
};

export const transaction = async <T = any>(fn: (sql: SQL) => Promise<T>): Promise<T> => {
  const client = await primaryPool.connect();

  try {
    await client.query("BEGIN");

    const sql: SQL = <T = any>(strings: TemplateStringsArray | string, ...values: any[]): Promise<pg.QueryResult<T>> =>
      typeof strings === "string"
        ? client.query(strings, values[0])
        : client.query(
            strings.reduce((previousValue, currentValue, i) => previousValue + "$" + i + currentValue),
            values,
          );

    const result = await fn(sql);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { primary as sql };
